export type FollowUpEntry = {
    id: string;
    date: string;
    note: string;
    agendaTaskId?: string;
};

export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  cpf?: string | null;
  course: string;
  unit: string;
  status: 'new' | 'contacted' | 'converted' | 'discarded';
  createdAt: string;
  followUpHistory?: FollowUpEntry[];
  entryType?: string | null;
}

export type Student = {
    id: string; // COD_ALUNO
    name: string; // NOME_ALUNO
    email: string | null; // EMAIL_ALUNO
    phone: string | null; // FONE_ALUNO
    cellphone: string | null; // CELULAR_ALUNO
    class: string | null; // TURMA_ALUNO
    group: string | null; // AGRUPAMENTO_ALUNO
    poloCode: string | null; // COD_POLO
    poloName: string | null; // NOME_POLO
    poloPartner: string | null; // PARCEIRO_POLO
    courseCode: string | null; // COD_CURSO
    courseName: string | null; // NOME_CURSO
    module: string | null; // MODULO
    studentType: string | null; // TIPO_ALUNO
    studentSituation: string | null; // SITUACAO_DO_ALUNO
    enrollmentSituation: string | null; // SITUACAO_MATRICULA_ALUNO_SEMESTRE
    enrollmentConfirmationDate: string | null; // DATA_CONF_MATRICULA
    isActive: boolean; // ALUNO_EH_ATIVO
    semester: string | null; // SEMESTRE
    classShift: string | null; // TURMA_TURNO
    classDay: string | null; // TURMA_DIA
    isDefaulter: boolean; // INADIMPLENTE
    accessSystem: string | null; // SISTEMA_ACESSO
    lastAccess: string | null; // ULTIMO_ACESSO
    entryMethod: string | null; // FORMA_INGRESSO
    tutorName: string | null; // TUTOR
    tutorEmail: string | null; // TUTOR_EMAIL
}

export type Candidate = {
  id: string;
  name: string;
  cpf?: string | null;
  registrationCode: string;
  registrationDate: string;
  enrollmentDate: string | null;
  course: string;
  status: 'Enrolled' | 'Contacted' | 'Registered' | 'Canceled' | 'Engaged';
  phone: string;
  specialist?: string | null;
  birthDate?: string | null;
  email?: string | null;
  firstPaymentPaid?: boolean | null;
  paymentDate?: string | null;
  entryMethod?: string | null;
  registrationLoginName?: string | null;
  cancellationDate?: string | null;
  city?: string | null;
  followUpHistory?: FollowUpEntry[];
  followUpNotes?: string | null;
};

export type Goal = {
  id: string;
  type: 'Enrollments' | 'Registrations' | 'Engagement';
  target: number;
  achieved: number;
};

export type AgendaTask = {
  id: string;
  date: string; // Formato 'yyyy-MM-dd'
  title: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  description?: string;
  recurrenceGroupId?: string;
  completed?: boolean;
  isInformational?: boolean;
  candidateId?: string;
  leadId?: string;
};

export type Specialist = {
  id: string;
  name: string;
};

export type Holiday = {
  id: string;
  date: string;
  name: string;
};

export type MessageTemplate = {
    id: string;
    name: string;
    content: string;
};

export type AuditLogEntry = {
    id: string;
    date: string; // ISO 8601 format
    action: string; // e.g., 'CREATE_SPECIALIST', 'UPDATE_GOAL'
    details: string; // e.g., 'Added specialist: Ana Costa', 'Updated Registrations goal to 250'
}

export type PoloGoals = {
  registrations: number;
  enrollments: number;
  engaged?: number;
};

export type ComparisonGoals = {
    [poloName: string]: PoloGoals;
}

export type PaymentCycle = {
  date: string | null;
  specialistValues: { [specialistName: string]: number };
};

export type PaidBonusesData = {
  isMetaBonusActive?: boolean;
  paymentCycles?: PaymentCycle[];
  comparisonGoals?: ComparisonGoals;
};
