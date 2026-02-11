import { redirect } from 'next/navigation';
import { getProjectById } from '@/app/actions/projects';
import ProjectPreAuditWizard from '@/components/projects/project-preaudit-wizard';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default async function ProjectPreAuditPage({ params }: { params: { id: string } }) {
    const result = await getProjectById(params.id);

    if (!result.success || !result.data) {
        redirect('/projects');
    }

    const project = result.data;

    return (
        <ErrorBoundary>
            <ProjectPreAuditWizard project={project} />
        </ErrorBoundary>
    );
}
