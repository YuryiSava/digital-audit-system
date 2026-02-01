import { redirect } from 'next/navigation';
import { getProjectById } from '@/app/actions/projects';
import ProjectPreAuditWizard from '@/components/projects/project-preaudit-wizard';

export default async function ProjectPreAuditPage({ params }: { params: { id: string } }) {
    const result = await getProjectById(params.id);

    if (!result.success || !result.data) {
        redirect('/projects');
    }

    const project = result.data;

    return <ProjectPreAuditWizard project={project} />;
}
