import type { Caption, SceneCard, SceneLink } from '../wanderer/types';
import { portfolioSlot } from './flow';
import type {
  EducationEntry,
  PortfolioLink,
  PortfolioProfile,
  PortfolioProject,
  SkillGroup,
  WorkExperience,
} from './types';

export interface PortfolioSceneContent {
  readonly captions: readonly Caption[];
  readonly cards: readonly SceneCard[];
}

function first<T>(values: readonly T[], label: string): T {
  const value = values[0];
  if (!value) throw new Error(`Portfolio profile requires ${label}.`);
  return value;
}

function dateRange({ startDate, endDate }: WorkExperience): string {
  return `${startDate}–${endDate ?? 'Present'}`;
}

function links(values: readonly PortfolioLink[]): readonly SceneLink[] {
  return values.map(({ label, href }) => ({ label, href }));
}

function experienceCard(experience: WorkExperience): SceneCard {
  const slot = portfolioSlot('experience');
  return {
    x: slot.x,
    en: [
      `${experience.company} / ${dateRange(experience)}`,
      experience.role,
      experience.summary,
      `${experience.achievements.join(' ')} Stack: ${experience.technologies.join(', ')}.`,
    ],
  };
}

function skillsCard(groups: readonly SkillGroup[]): SceneCard {
  const slot = portfolioSlot('skills');
  return {
    x: slot.x,
    en: [
      'Toolkit / Full-stack development',
      'How I build',
      groups.map(({ label }) => label).join(' · '),
      groups
        .map(({ label, skills }) => `${label}: ${skills.join(', ')}.`)
        .join(' '),
    ],
  };
}

function projectCard(
  project: PortfolioProject,
  slotId: 'featured-project' | 'project-two' | 'project-three',
): SceneCard {
  const slot = portfolioSlot(slotId);
  return {
    x: slot.x,
    en: [
      `${slotId === 'featured-project' ? 'Featured project' : 'Project'} / ${project.technologies.join(' · ')}`,
      project.name,
      project.summary,
      `Problem: ${project.problem} Contribution: ${project.contribution} Outcome: ${project.outcome}`,
    ],
    links: links(project.links),
  };
}

function educationCard(
  education: EducationEntry,
  certifications: readonly string[],
): SceneCard {
  const slot = portfolioSlot('education');
  const dates = [education.startDate, education.endDate]
    .filter(Boolean)
    .join('–');
  const certificationText = certifications.length
    ? ` Certifications: ${certifications.join(', ')}.`
    : '';
  return {
    x: slot.x,
    en: [
      `Education${dates ? ` / ${dates}` : ''}`,
      education.qualification,
      education.institution,
      `${education.detail ?? 'Academic foundation for practical software development.'}${certificationText}`,
    ],
  };
}

export function createPortfolioSceneContent(
  profile: PortfolioProfile,
): PortfolioSceneContent {
  const primaryExperience = first(
    profile.experience,
    'at least one work experience',
  );
  const primaryEducation = first(
    profile.education,
    'at least one education entry',
  );
  first(profile.skills, 'at least one skill group');
  const featured =
    profile.projects.find(({ featured }) => featured) ??
    first(profile.projects, 'at least one project');
  const remainingProjects = profile.projects.filter(
    ({ id }) => id !== featured.id,
  );
  const engineeringSlot = portfolioSlot('engineering-story');
  const contactSlot = portfolioSlot('contact');

  const cards: SceneCard[] = [
    experienceCard(primaryExperience),
    skillsCard(profile.skills),
    projectCard(featured, 'featured-project'),
    {
      x: engineeringSlot.x,
      y: 220,
      revealRadius: 180,
      en: [
        'Engineering story / River wreck',
        profile.engineeringStory.title,
        profile.engineeringStory.challenge,
        `Response: ${profile.engineeringStory.response} Outcome: ${profile.engineeringStory.outcome} Stack: ${profile.engineeringStory.technologies.join(', ')}.`,
      ],
    },
  ];

  const secondProject = remainingProjects[0];
  if (secondProject) cards.push(projectCard(secondProject, 'project-two'));
  const thirdProject = remainingProjects[1];
  if (thirdProject) cards.push(projectCard(thirdProject, 'project-three'));

  cards.push(educationCard(primaryEducation, profile.certifications), {
    x: contactSlot.x,
    en: [
      'Contact / End of the trail',
      `Build something with ${profile.identity.name}`,
      profile.contact.message,
      `Email: ${profile.contact.email}`,
    ],
    links: links(profile.contact.links),
  });

  return {
    captions: [
      {
        x: portfolioSlot('identity').x,
        en: `${profile.identity.name} — ${profile.identity.role}`,
      },
    ],
    cards,
  };
}
