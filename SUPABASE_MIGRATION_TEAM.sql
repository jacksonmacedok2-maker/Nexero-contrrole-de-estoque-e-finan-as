
-- ======================================================
-- GESTÃO DE EQUIPE E MULTI-TENANCY - NEXERO (FIXED POLICIES)
-- ======================================================

-- 1. Tabela de Empresas
CREATE TABLE IF NOT EXISTS public.companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    owner_user_id uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Tabela de Membros
CREATE TABLE IF NOT EXISTS public.memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'SELLER', 'VIEWER')),
    status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- 3. Tabela de Convites
CREATE TABLE IF NOT EXISTS public.invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    invited_name text,
    invited_email text NOT NULL,
    role text NOT NULL CHECK (role IN ('ADMIN', 'SELLER', 'VIEWER')),
    token text DEFAULT encode(gen_random_bytes(32), 'hex') UNIQUE,
    status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- 4. Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE ACESSO (CORRIGIDAS PARA EVITAR RECURSÃO)

-- Empresas: Dono tem acesso total
DROP POLICY IF EXISTS "companies_owner_access" ON public.companies;
CREATE POLICY "companies_owner_access" ON public.companies FOR ALL TO authenticated 
USING (owner_user_id = auth.uid());

-- Membros: Permitir que membros vejam seus próprios registros
DROP POLICY IF EXISTS "memberships_view_own" ON memberships;
CREATE POLICY "memberships_view_own" ON memberships FOR SELECT TO authenticated 
USING (user_id = auth.uid());

-- Membros: Permitir que Donos da empresa gerenciem membros (via tabela de empresas para evitar recursão)
DROP POLICY IF EXISTS "memberships_owner_manage" ON memberships;
CREATE POLICY "memberships_owner_manage" ON memberships FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.companies c 
        WHERE c.id = memberships.company_id 
        AND c.owner_user_id = auth.uid()
    )
);

-- Convites: Permitir que Donos gerenciem convites
DROP POLICY IF EXISTS "invitations_owner_manage" ON invitations;
CREATE POLICY "invitations_owner_manage" ON invitations FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.companies c 
        WHERE c.id = invitations.company_id 
        AND c.owner_user_id = auth.uid()
    )
);

-- 6. FUNÇÃO RPC PARA ACEITAR CONVITE
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invite invitations;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    -- Busca convite válido
    SELECT * INTO v_invite FROM invitations 
    WHERE token = p_token AND status = 'PENDING' AND expires_at > now();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Convite inválido ou expirado';
    END IF;

    -- Cria o membership
    INSERT INTO public.memberships (user_id, company_id, role, status)
    VALUES (v_user_id, v_invite.company_id, v_invite.role, 'ACTIVE')
    ON CONFLICT (user_id, company_id) DO UPDATE 
    SET role = EXCLUDED.role, status = 'ACTIVE';

    -- Marca convite como aceito
    UPDATE invitations SET status = 'ACCEPTED' WHERE id = v_invite.id;

    RETURN true;
END;
$$;
