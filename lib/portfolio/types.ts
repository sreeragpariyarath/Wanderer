export type PortfolioLinkKind =
  'live' | 'source' | 'case-study' | 'resume' | 'email' | 'github' | 'linkedin';

export interface PortfolioLink {
  readonly label: string;
  readonly href: string;
  readonly kind: PortfolioLinkKind;
}

export interface PortfolioIdentity {
  readonly name: string;
  readonly role: string;
  readonly experienceLabel: string;
  readonly location?: string;
  readonly introduction: string;
  readonly about: string;
}

export interface WorkExperience {
  readonly company: string;
  readonly role: string;
  readonly startDate: string;
  readonly endDate?: string;
  readonly summary: string;
  readonly achievements: readonly string[];
  readonly technologies: readonly string[];
}

export interface SkillGroup {
  readonly label: string;
  readonly skills: readonly string[];
}

export interface PortfolioProject {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly problem: string;
  readonly contribution: string;
  readonly outcome: string;
  readonly technologies: readonly string[];
  readonly links: readonly PortfolioLink[];
  readonly featured?: boolean;
}

export interface EngineeringStory {
  readonly title: string;
  readonly challenge: string;
  readonly response: string;
  readonly outcome: string;
  readonly technologies: readonly string[];
}

export interface EducationEntry {
  readonly qualification: string;
  readonly institution: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly detail?: string;
}

export interface PortfolioContact {
  readonly message: string;
  readonly email: string;
  readonly links: readonly PortfolioLink[];
}

export interface PortfolioProfile {
  readonly identity: PortfolioIdentity;
  readonly experience: readonly WorkExperience[];
  readonly skills: readonly SkillGroup[];
  readonly projects: readonly PortfolioProject[];
  readonly engineeringStory: EngineeringStory;
  readonly education: readonly EducationEntry[];
  readonly certifications: readonly string[];
  readonly contact: PortfolioContact;
}
