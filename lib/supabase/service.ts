import { getSupabaseClient, isSupabaseConfigured } from './client';
import { ChildProfile, LevelInfo, Medal, Storybook } from '../types';
import {
  INITIAL_LEVELS,
  INITIAL_MEDALS,
  PRIMEIRO_ANO_UNLOCK_MARKER_PHASE_ID,
  isEducacaoInfantilCompleted,
  isPrimeiroAnoAccessible,
  reconcileLevelsWithCanonical,
} from '../game-data';
import { isPhonemeAnswerCorrect } from '../utils';

export interface AuthResult {
  success: boolean;
  userId?: string;
  email?: string;
  name?: string;
  error?: string;
  requiresEmailConfirmation?: boolean;
}

export interface ServiceResult {
  success: boolean;
  error?: string;
}

export interface ChildSaveResult extends ServiceResult {
  child?: ChildProfile;
}

export interface RestoredWorkspace {
  child: ChildProfile | null;
  levels: LevelInfo[];
  medals: Medal[];
  completedBookIds: string[];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function cloneInitialLevels(): LevelInfo[] {
  return INITIAL_LEVELS.map((lvl) => ({
    ...lvl,
    phases: lvl.phases.map((p) => ({ ...p })),
  }));
}

function cloneInitialMedals(): Medal[] {
  return INITIAL_MEDALS.map((m) => ({ ...m }));
}

function translateSupabaseError(rawMessage: string, code?: string): string {
  const msg = rawMessage.toLowerCase();

  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('fetch failed') ||
    msg.includes('err_name_not_resolved')
  ) {
    return 'Erro de conexão com o Supabase. Verifique sua internet e se a URL (NEXT_PUBLIC_SUPABASE_URL) está correta.';
  }

  if (msg.includes('invalid api key') || msg.includes('no api key')) {
    return 'Chave de API do Supabase inválida ou ausente (NEXT_PUBLIC_SUPABASE_ANON_KEY).';
  }

  if (
    msg.includes('user already registered') ||
    msg.includes('already been registered') ||
    msg.includes('already exists')
  ) {
    return 'Este e-mail já está cadastrado. Use a aba "Já Tenho Conta (Entrar)" para fazer login.';
  }

  if (
    msg.includes('password should be at least') ||
    msg.includes('weak_password') ||
    code === 'weak_password'
  ) {
    return 'A senha deve conter no mínimo 6 caracteres para atender à política de segurança do Supabase Auth.';
  }

  if (msg.includes('unable to validate email') || msg.includes('invalid format')) {
    return 'O formato do e-mail informado é inválido. Confira e tente novamente.';
  }

  if (msg.includes('signups not allowed')) {
    return 'Novos cadastros estão bloqueados nas configurações do Supabase Auth.';
  }

  if (msg.includes('email not confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou desative a confirmação de e-mail no Supabase.';
  }

  if (msg.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos. Confira seus dados e tente novamente.';
  }

  if (
    msg.includes('rate limit') ||
    msg.includes('over_email_send_rate_limit') ||
    msg.includes('for security purposes')
  ) {
    return 'Muitas tentativas em sequência. Aguarde alguns segundos antes de tentar novamente.';
  }

  if (
    code === '42501' ||
    msg.includes('row-level security') ||
    msg.includes('permission denied')
  ) {
    return 'Operação bloqueada por política de segurança (RLS) no Supabase. Verifique as políticas da tabela public.profiles em supabase/schema.sql.';
  }

  if (
    code === '42P01' ||
    code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table')
  ) {
    return 'Tabela não encontrada no Supabase (public.profiles). Execute o script supabase/schema.sql no SQL Editor do seu projeto.';
  }

  return rawMessage;
}

// 1. Cadastrar Responsável (Auth + public.profiles)
export async function signUpWithSupabase(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const cleanName = name.trim();
  const cleanEmail = email.trim();

  if (!cleanName) {
    return {
      success: false,
      error: 'Por favor, informe o nome do responsável ou educador.',
    };
  }

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      success: false,
      error: 'Por favor, informe um e-mail válido para o cadastro.',
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: 'A senha deve conter no mínimo 6 caracteres.',
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      error:
        'Configuração do Supabase ausente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para cadastrar no Supabase Auth e salvar em public.profiles.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          role: 'parent',
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: translateSupabaseError(error.message, (error as { code?: string }).code),
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Não foi possível concluir o cadastro: o Supabase Auth não retornou o usuário.',
      };
    }

    // Proteção anti-enumeração do Supabase quando o e-mail já existe
    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        success: false,
        error: 'Este e-mail já está cadastrado no Supabase. Use a aba "Já Tenho Conta (Entrar)" para acessar.',
      };
    }

    // Quando "Confirm email" está ativo, o Supabase não retorna session imediata e bloqueia RLS de escrita pelo cliente
    if (!data.session) {
      return {
        success: false,
        requiresEmailConfirmation: true,
        error:
          'Cadastro criado no Supabase Auth, aguardando confirmação de e-mail. Confirme o link enviado para o seu e-mail antes de continuar (ou desative "Confirm email" em Authentication > Providers > Email no Supabase).',
      };
    }

    // Inserir / atualizar explicitamente na tabela public.profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          full_name: cleanName,
          email: data.user.email || cleanEmail,
          role: 'parent',
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: 'id' }
      );

    if (profileError) {
      return {
        success: false,
        error: `Cadastro criado no Auth, mas houve erro ao salvar na tabela public.profiles: ${translateSupabaseError(
          profileError.message,
          profileError.code
        )}`,
      };
    }

    return {
      success: true,
      userId: data.user.id,
      email: data.user.email || cleanEmail,
      name: cleanName,
    };
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : 'Falha de conexão ao cadastrar no Supabase.';
    return { success: false, error: translateSupabaseError(raw) };
  }
}

// 2. Fazer Login do Responsável (Auth + sincronização de public.profiles)
export async function signInWithSupabase(
  email: string,
  password: string
): Promise<AuthResult> {
  const cleanEmail = email.trim();

  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      error:
        'Configuração do Supabase ausente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para fazer login.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      return {
        success: false,
        error: translateSupabaseError(error.message, (error as { code?: string }).code),
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        error: 'Não foi possível iniciar a sessão no Supabase.',
      };
    }

    const fullName =
      (typeof data.user.user_metadata?.full_name === 'string' &&
        data.user.user_metadata.full_name.trim()) ||
      'Responsável';

    // Garante que o registro em public.profiles exista após login (ex.: após confirmação de e-mail)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          full_name: fullName,
          email: data.user.email || cleanEmail,
          role: 'parent',
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: 'id' }
      );

    if (profileError) {
      return {
        success: false,
        error: `Login realizado, mas houve erro ao sincronizar public.profiles: ${translateSupabaseError(
          profileError.message,
          profileError.code
        )}`,
      };
    }

    return {
      success: true,
      userId: data.user.id,
      email: data.user.email || cleanEmail,
      name: fullName,
    };
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : 'Falha de conexão ao fazer login.';
    return { success: false, error: translateSupabaseError(raw) };
  }
}

// 3. Deslogar
export async function signOutWithSupabase(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
}

// 3b. Obter ID do responsável autenticado na sessão atual do Supabase
export async function getCurrentSupabaseUserId(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured()) return null;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

// 4. Salvar ou Sincronizar Perfil da Criança (retorna o registro com UUID real do Supabase)
export async function saveChildProfileWithResultToSupabase(
  child: ChildProfile,
  parentId?: string
): Promise<ChildSaveResult> {
  const supabase = getSupabaseClient();
  if (!supabase || !parentId) {
    return {
      success: false,
      error: 'Sessão do responsável não encontrada para salvar o perfil da criança.',
    };
  }

  try {
    const hasValidUuid = isUuid(child.id);
    const payload = {
      ...(hasValidUuid ? { id: child.id } : {}),
      parent_id: parentId,
      name: child.name.trim(),
      avatar_id: child.avatarId,
      avatar_custom_url: child.avatarCustomUrl || null,
      age_group: child.ageGroup,
      updated_at: new Date().toISOString(),
    };

    const query = hasValidUuid
      ? supabase
          .from('children')
          .upsert(payload as any, { onConflict: 'id' })
          .select('id, name, avatar_id, avatar_custom_url, age_group, created_at')
          .single()
      : supabase
          .from('children')
          .insert(payload as any)
          .select('id, name, avatar_id, avatar_custom_url, age_group, created_at')
          .single();

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: translateSupabaseError(error.message, error.code),
      };
    }

    const row = data as {
      id: string;
      name: string;
      avatar_id: string;
      avatar_custom_url: string | null;
      age_group: string;
      created_at: string;
    } | null;

    const savedChild: ChildProfile = row
      ? {
          id: row.id,
          name: row.name,
          avatarId: row.avatar_id,
          avatarCustomUrl: row.avatar_custom_url || undefined,
          ageGroup: row.age_group,
          cycleStage: child.cycleStage,
          primeiroAnoUnlocked: child.primeiroAnoUnlocked,
          primeiroAnoUnlockedAt: child.primeiroAnoUnlockedAt,
          createdAt: row.created_at
            ? new Date(row.created_at).toLocaleDateString('pt-BR')
            : child.createdAt,
        }
      : child;

    return { success: true, child: savedChild };
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : 'Falha ao salvar perfil da criança.';
    return { success: false, error: translateSupabaseError(raw) };
  }
}

export async function saveChildProfileToSupabase(
  child: ChildProfile,
  parentId?: string
): Promise<boolean> {
  const result = await saveChildProfileWithResultToSupabase(child, parentId);
  return result.success;
}

// 4b. Carregar Perfil da Criança + Etapas Concluídas + Medalhas do Supabase
export async function loadChildWorkspaceFromSupabase(
  parentId: string
): Promise<RestoredWorkspace> {
  const emptyWorkspace: RestoredWorkspace = {
    child: null,
    levels: cloneInitialLevels(),
    medals: cloneInitialMedals(),
    completedBookIds: [],
  };

  const supabase = getSupabaseClient();
  if (!supabase || !isUuid(parentId)) {
    return emptyWorkspace;
  }

  try {
    const { data: childrenRows, error: childError } = await supabase
      .from('children')
      .select('id, name, avatar_id, avatar_custom_url, age_group, created_at')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (childError || !childrenRows || childrenRows.length === 0) {
      return emptyWorkspace;
    }

    const row = childrenRows[0] as {
      id: string;
      name: string;
      avatar_id: string;
      avatar_custom_url: string | null;
      age_group: string;
      created_at: string;
    };

    const child: ChildProfile = {
      id: row.id,
      name: row.name,
      avatarId: row.avatar_id,
      avatarCustomUrl: row.avatar_custom_url || undefined,
      ageGroup: row.age_group,
      createdAt: row.created_at
        ? new Date(row.created_at).toLocaleDateString('pt-BR')
        : new Date().toLocaleDateString('pt-BR'),
    };

    const [{ data: progressRows }, { data: medalRows }] = await Promise.all([
      supabase
        .from('game_progress')
        .select('phase_id, stars_earned, status')
        .eq('child_id', row.id),
      supabase
        .from('medals_unlocked')
        .select('medal_id, unlocked_at')
        .eq('child_id', row.id),
    ]);

    const mergedLevels = cloneInitialLevels();
    const typedProgress = (progressRows || []) as Array<{
      phase_id: string;
      stars_earned: number;
      status: 'completed' | 'current' | 'locked';
    }>;

    const progressMap = new Map(typedProgress.map((p) => [p.phase_id, p]));

    if (typedProgress.length > 0) {
      const flatPhases = mergedLevels.flatMap((lvl) => lvl.phases);

      flatPhases.forEach((phase) => {
        const saved = progressMap.get(phase.id);
        if (saved) {
          phase.starsEarned = saved.stars_earned;
          phase.status = saved.status;
        }
      });

      // Garante que a fase seguinte à última concluída fique desbloqueada ('current')
      let lastCompletedIdx = -1;
      flatPhases.forEach((p, idx) => {
        if (p.status === 'completed') lastCompletedIdx = idx;
      });
      const hasCurrent = flatPhases.some((p) => p.status === 'current');
      if (!hasCurrent && lastCompletedIdx >= 0 && lastCompletedIdx + 1 < flatPhases.length) {
        if (flatPhases[lastCompletedIdx + 1].status === 'locked') {
          flatPhases[lastCompletedIdx + 1].status = 'current';
        }
      }
    }

    const mergedMedals = cloneInitialMedals();
    const typedMedals = (medalRows || []) as Array<{
      medal_id: string;
      unlocked_at: string;
    }>;

    const medalMap = new Map(typedMedals.map((m) => [m.medal_id, m.unlocked_at]));
    if (typedMedals.length > 0) {
      mergedMedals.forEach((medal) => {
        const unlockedAt = medalMap.get(medal.id);
        if (unlockedAt) {
          medal.unlocked = true;
          medal.unlockedDate = new Date(unlockedAt).toLocaleDateString('pt-BR');
        }
      });
    }

    const hasUnlockMarker =
      progressMap.get(PRIMEIRO_ANO_UNLOCK_MARKER_PHASE_ID)?.status === 'completed';
    const hasGraduationMedal = medalMap.has('m11');
    const primeiroAnoUnlocked =
      hasUnlockMarker ||
      hasGraduationMedal ||
      isPrimeiroAnoAccessible(mergedLevels, null);

    if (primeiroAnoUnlocked) {
      child.primeiroAnoUnlocked = true;
      child.cycleStage = 'primeiro_ano';
      const unlockedAtRaw = medalMap.get('m11');
      if (unlockedAtRaw) {
        child.primeiroAnoUnlockedAt = new Date(unlockedAtRaw).toLocaleDateString('pt-BR');
      }
      const m11 = mergedMedals.find((m) => m.id === 'm11');
      if (m11 && !m11.unlocked) {
        m11.unlocked = true;
        m11.unlockedDate = child.primeiroAnoUnlockedAt || 'Hoje';
      }
    } else {
      child.cycleStage = 'educacao_infantil';
      child.primeiroAnoUnlocked = false;
    }

    const completedBookIds = typedProgress
      .filter((p) => p.phase_id.startsWith('book-') && p.status === 'completed')
      .map((p) => p.phase_id.replace(/^book-/, ''));

    return {
      child,
      levels: reconcileLevelsWithCanonical(mergedLevels, primeiroAnoUnlocked),
      medals: mergedMedals,
      completedBookIds,
    };
  } catch {
    return emptyWorkspace;
  }
}

// 4c. Restaurar sessão ativa e progresso salvo do Supabase (útil ao recarregar a página)
export async function getActiveSessionWorkspace(): Promise<{
  userId: string;
  email: string;
  name: string;
  workspace: RestoredWorkspace;
} | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured()) {
    return null;
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    const workspace = await loadChildWorkspaceFromSupabase(session.user.id);
    const fullName =
      (typeof session.user.user_metadata?.full_name === 'string' &&
        session.user.user_metadata.full_name.trim()) ||
      'Responsável';

    return {
      userId: session.user.id,
      email: session.user.email || '',
      name: fullName,
      workspace,
    };
  } catch {
    return null;
  }
}

// 4d. Sincronizar fases, livros e medalhas da criança no Supabase
export async function saveInitialProgressForChildToSupabase(
  childId: string,
  levels: LevelInfo[],
  medals: Medal[] = [],
  completedBookIds: string[] = [],
  childProfile?: Pick<ChildProfile, 'primeiroAnoUnlocked'> | null
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase || !isUuid(childId)) return;

  try {
    const nowIso = new Date().toISOString();
    const primeiroAnoUnlocked = isPrimeiroAnoAccessible(levels, childProfile);
    const syncedLevels = reconcileLevelsWithCanonical(levels, primeiroAnoUnlocked);

    const phaseRows = syncedLevels
      .flatMap((lvl) => lvl.phases)
      .filter((phase) => phase.status !== 'locked')
      .map((phase) => ({
        child_id: childId,
        phase_id: phase.id,
        level_id: phase.levelId,
        stars_earned: phase.starsEarned,
        status: phase.status,
        completed_at: phase.status === 'completed' ? nowIso : null,
        updated_at: nowIso,
      }));

    const cycleMarkerRows = primeiroAnoUnlocked
      ? [
          {
            child_id: childId,
            phase_id: PRIMEIRO_ANO_UNLOCK_MARKER_PHASE_ID,
            level_id: 4,
            stars_earned: 3,
            status: 'completed' as const,
            completed_at: nowIso,
            updated_at: nowIso,
          },
        ]
      : [];

    const bookRows = completedBookIds.map((bookId) => ({
      child_id: childId,
      phase_id: `book-${bookId}`,
      level_id: 4,
      stars_earned: 3,
      status: 'completed' as const,
      completed_at: nowIso,
      updated_at: nowIso,
    }));

    const rowsToInsert = [...phaseRows, ...cycleMarkerRows, ...bookRows];

    if (rowsToInsert.length > 0) {
      await supabase
        .from('game_progress')
        .upsert(rowsToInsert as any, { onConflict: 'child_id,phase_id' });
    }

    if (primeiroAnoUnlocked) {
      await (
        supabase.from('children') as unknown as {
          update: (values: { age_group: string; updated_at: string }) => {
            eq: (col: string, val: string) => Promise<unknown>;
          };
        }
      )
        .update({
          age_group: '1º Ano Fundamental (6 a 7 anos)',
          updated_at: nowIso,
        })
        .eq('id', childId);
    }

    const unlockedMedals = medals.filter((m) => m.unlocked);
    if (unlockedMedals.length > 0) {
      await supabase.from('medals_unlocked').upsert(
        unlockedMedals.map((m) => ({
          child_id: childId,
          medal_id: m.id,
          unlocked_at: nowIso,
        })) as any,
        { onConflict: 'child_id,medal_id' }
      );
    }
  } catch {
    // Ignore sync errors
  }
}

// 4d-bis. Persistir desbloqueio automático do ciclo 1º Ano Fundamental no Supabase
export async function unlockPrimeiroAnoInSupabase(
  childId: string,
  unlockedAtIso: string = new Date().toISOString()
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !isUuid(childId)) return false;

  try {
    await (
      supabase.from('children') as unknown as {
        update: (values: { age_group: string; updated_at: string }) => {
          eq: (col: string, val: string) => Promise<unknown>;
        };
      }
    )
      .update({
        age_group: '1º Ano Fundamental (6 a 7 anos)',
        updated_at: unlockedAtIso,
      })
      .eq('id', childId);

    const { data: existingPhase13 } = await supabase
      .from('game_progress')
      .select('status, stars_earned')
      .eq('child_id', childId)
      .eq('phase_id', 'fase-13')
      .maybeSingle();

    const rowsToUpsert: Array<{
      child_id: string;
      phase_id: string;
      level_id: number;
      stars_earned: number;
      status: 'completed' | 'current';
      completed_at: string | null;
      updated_at: string;
    }> = [
      {
        child_id: childId,
        phase_id: PRIMEIRO_ANO_UNLOCK_MARKER_PHASE_ID,
        level_id: 4,
        stars_earned: 3,
        status: 'completed',
        completed_at: unlockedAtIso,
        updated_at: unlockedAtIso,
      },
    ];

    const existingStatus = (existingPhase13 as { status?: string } | null)?.status;
    if (!existingStatus || existingStatus === 'locked') {
      rowsToUpsert.push({
        child_id: childId,
        phase_id: 'fase-13',
        level_id: 4,
        stars_earned: 0,
        status: 'current',
        completed_at: null,
        updated_at: unlockedAtIso,
      });
    }

    const { error: progressError } = await supabase
      .from('game_progress')
      .upsert(rowsToUpsert as any, { onConflict: 'child_id,phase_id' });

    await supabase.from('medals_unlocked').upsert(
      {
        child_id: childId,
        medal_id: 'm11',
        unlocked_at: unlockedAtIso,
      } as any,
      { onConflict: 'child_id,medal_id' }
    );

    return !progressError;
  } catch {
    return false;
  }
}

// 4e. Persistência local por conta (e-mail) para manter nome da criança e etapas concluídas salvos mesmo ao sair/entrar
const SAVED_ACCOUNTS_STORAGE_KEY = 'aventura_saved_accounts_v1';

export interface SavedLocalAccountSnapshot {
  parentName?: string;
  parentEmail: string;
  parentId?: string;
  child: ChildProfile | null;
  levels: LevelInfo[];
  medals: Medal[];
  completedBookIds: string[];
  updatedAt: string;
}

export function saveLocalAccountWorkspace(
  email: string,
  snapshot: Omit<SavedLocalAccountSnapshot, 'parentEmail' | 'updatedAt'>
): void {
  if (typeof window === 'undefined') return;
  const key = email.trim().toLowerCase();
  if (!key) return;

  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
    const parsed: Record<string, SavedLocalAccountSnapshot> = raw ? JSON.parse(raw) : {};
    const unlocked = isPrimeiroAnoAccessible(snapshot.levels, snapshot.child);
    const syncedChild = snapshot.child
      ? {
          ...snapshot.child,
          primeiroAnoUnlocked: unlocked,
          cycleStage: unlocked ? ('primeiro_ano' as const) : ('educacao_infantil' as const),
        }
      : null;

    parsed[key] = {
      ...snapshot,
      child: syncedChild,
      parentEmail: key,
      levels: reconcileLevelsWithCanonical(snapshot.levels, unlocked),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadLocalAccountWorkspace(email: string): RestoredWorkspace | null {
  if (typeof window === 'undefined') return null;
  const key = email.trim().toLowerCase();
  if (!key) return null;

  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed: Record<string, SavedLocalAccountSnapshot> = JSON.parse(raw);
    const entry = parsed[key];
    if (!entry || !entry.child) return null;

    const baseLevels = entry.levels || cloneInitialLevels();
    const unlocked = isPrimeiroAnoAccessible(baseLevels, entry.child);
    const savedMedalMap = new Map((entry.medals || []).map((m) => [m.id, m]));
    const restoredMedals = cloneInitialMedals().map((base) => savedMedalMap.get(base.id) || base);
    if (unlocked) {
      const m11 = restoredMedals.find((m) => m.id === 'm11');
      if (m11 && !m11.unlocked) {
        m11.unlocked = true;
        m11.unlockedDate = entry.child.primeiroAnoUnlockedAt || 'Hoje';
      }
    }

    return {
      child: {
        ...entry.child,
        primeiroAnoUnlocked: unlocked,
        cycleStage: unlocked ? 'primeiro_ano' : 'educacao_infantil',
      },
      levels: reconcileLevelsWithCanonical(baseLevels, unlocked),
      medals: restoredMedals,
      completedBookIds: Array.isArray(entry.completedBookIds) ? entry.completedBookIds : [],
    };
  } catch {
    return null;
  }
}

// 4f. Combinar progresso salvo do Supabase com eventuais etapas concluídas localmente
export function mergeRestoredWorkspaces(
  primary: RestoredWorkspace,
  secondary: RestoredWorkspace | null
): RestoredWorkspace {
  if (!secondary) {
    const unlockedPrimary = isPrimeiroAnoAccessible(primary.levels, primary.child);
    return {
      ...primary,
      child: primary.child
        ? {
            ...primary.child,
            primeiroAnoUnlocked: unlockedPrimary,
            cycleStage: unlockedPrimary ? 'primeiro_ano' : 'educacao_infantil',
          }
        : null,
      levels: reconcileLevelsWithCanonical(primary.levels, unlockedPrimary),
    };
  }

  const primaryPhases = new Map(
    primary.levels.flatMap((l) => l.phases).map((p) => [p.id, p])
  );
  const secondaryPhases = new Map(
    secondary.levels.flatMap((l) => l.phases).map((p) => [p.id, p])
  );

  const mergedLevels = cloneInitialLevels().map((lvl) => ({
    ...lvl,
    phases: lvl.phases.map((p) => {
      const a = primaryPhases.get(p.id);
      const b = secondaryPhases.get(p.id);
      const isCompleted = a?.status === 'completed' || b?.status === 'completed';
      const isCurrent = !isCompleted && (a?.status === 'current' || b?.status === 'current');
      return {
        ...p,
        starsEarned: Math.max(a?.starsEarned || 0, b?.starsEarned || 0, p.starsEarned),
        status: isCompleted
          ? ('completed' as const)
          : isCurrent
          ? ('current' as const)
          : p.status,
      };
    }),
  }));

  const aMedals = new Map(primary.medals.map((m) => [m.id, m]));
  const bMedals = new Map(secondary.medals.map((m) => [m.id, m]));
  const mergedMedals = cloneInitialMedals().map((base) => {
    const mA = aMedals.get(base.id);
    const mB = bMedals.get(base.id);
    if (mA?.unlocked) return mA;
    if (mB?.unlocked) return mB;
    return base;
  });

  const mergedBooks = Array.from(
    new Set([...(primary.completedBookIds || []), ...(secondary.completedBookIds || [])])
  );

  const unlocked =
    isEducacaoInfantilCompleted(mergedLevels) ||
    isPrimeiroAnoAccessible(mergedLevels, primary.child) ||
    isPrimeiroAnoAccessible(mergedLevels, secondary.child) ||
    Boolean(mergedMedals.find((m) => m.id === 'm11')?.unlocked);

  if (unlocked) {
    const m11 = mergedMedals.find((m) => m.id === 'm11');
    if (m11 && !m11.unlocked) {
      m11.unlocked = true;
      m11.unlockedDate = 'Hoje';
    }
  }

  const baseChild = primary.child || secondary.child;
  const mergedChild: ChildProfile | null = baseChild
    ? {
        ...baseChild,
        ageGroup: unlocked
          ? '1º Ano Fundamental (6 a 7 anos)'
          : baseChild.ageGroup,
        cycleStage: unlocked ? 'primeiro_ano' : 'educacao_infantil',
        primeiroAnoUnlocked: unlocked,
        primeiroAnoUnlockedAt:
          primary.child?.primeiroAnoUnlockedAt ||
          secondary.child?.primeiroAnoUnlockedAt,
      }
    : null;

  return {
    child: mergedChild,
    levels: reconcileLevelsWithCanonical(mergedLevels, unlocked),
    medals: mergedMedals,
    completedBookIds: mergedBooks,
  };
}

// 5. Salvar Progresso de Fase no Supabase
export async function savePhaseProgressToSupabase(
  childId: string,
  phaseId: string,
  levelId: number,
  starsEarned: number,
  status: 'completed' | 'current' | 'locked'
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !isUuid(childId)) return false;

  try {
    const { error } = await supabase.from('game_progress').upsert(
      {
        child_id: childId,
        phase_id: phaseId,
        level_id: levelId,
        stars_earned: starsEarned,
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: 'child_id,phase_id' }
    );

    return !error;
  } catch {
    return false;
  }
}

// 6. Salvar Medalha Desbloqueada no Supabase
export async function saveMedalToSupabase(
  childId: string,
  medalId: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !isUuid(childId)) return false;

  try {
    const { error } = await supabase.from('medals_unlocked').upsert(
      {
        child_id: childId,
        medal_id: medalId,
        unlocked_at: new Date().toISOString(),
      } as any,
      { onConflict: 'child_id,medal_id' }
    );

    return !error;
  } catch {
    return false;
  }
}

// 7. Registrar Log de Atividade Sonora / Fonema (para métricas da BNCC)
export async function logActivityToSupabase(params: {
  childId: string;
  phaseId: string;
  questionId: string;
  targetLetter: string;
  targetWord: string;
  chosenOptionLetter: string;
  isCorrect: boolean;
  timeSpentSeconds?: number;
}): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !isUuid(params.childId)) return false;

  try {
    const normalizedMatch = isPhonemeAnswerCorrect(
      params.chosenOptionLetter,
      params.targetLetter
    );
    const verifiedIsCorrect = params.isCorrect || normalizedMatch;

    const { error } = await supabase.from('activity_logs').insert({
      child_id: params.childId,
      phase_id: params.phaseId,
      question_id: params.questionId,
      target_letter: params.targetLetter,
      target_word: params.targetWord,
      chosen_option_letter: params.chosenOptionLetter,
      is_correct: verifiedIsCorrect,
      time_spent_seconds: params.timeSpentSeconds || 0,
      created_at: new Date().toISOString(),
    } as any);

    return !error;
  } catch {
    return false;
  }
}

// 8. Registrar Leitura Completa de Livro na Biblioteca de Histórias
export async function saveBookCompletionToSupabase(
  childId: string,
  book: Storybook
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !isUuid(childId)) return false;

  const progressSaved = await savePhaseProgressToSupabase(
    childId,
    `book-${book.id}`,
    1,
    3,
    'completed'
  );

  const firstPage = book.pages[0];
  await logActivityToSupabase({
    childId,
    phaseId: `book-${book.id}`,
    questionId: 'storybook-read',
    targetLetter: firstPage?.highlightLetter || 'L',
    targetWord: book.title,
    chosenOptionLetter: firstPage?.highlightLetter || 'L',
    isCorrect: true,
    timeSpentSeconds: book.pages.length * 20,
  });

  return progressSaved;
}
