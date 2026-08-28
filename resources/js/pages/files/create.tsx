import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

import Heading from '@/components/heading';
import ChunkedUploadDashboard from '@/components/uploads/chunked-upload-dashboard';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';

interface FilesCreateProps {
    max_file_size_mb: number;
    part_size_mb: number;
    allowed_extensions: string[] | null;
    clients: { id: number; name: string }[];
    groups: { id: number; name: string }[];
    recent_targets: { type: 'client' | 'group'; id: number; name: string }[];
    message_templates: { id: number; name: string; body: string }[];
    send_url: string;
    template_store_url: string;
}

export default function FilesCreate({
    max_file_size_mb,
    part_size_mb,
    allowed_extensions,
    clients,
    groups,
    recent_targets,
    message_templates,
    send_url,
    template_store_url,
}: FilesCreateProps) {
    const { t } = useTranslation();
    const [fileIds, setFileIds] = useState<number[]>([]);
    const sendForm = useForm({ file_ids: [] as number[], type: 'client', id: '', message: '' });
    const templateForm = useForm({ name: '', body: '' });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('All files'), href: '/files' },
        { title: t('Upload'), href: '/files/upload' },
    ];

    const handleComplete = (fileIds: number[]) => {
        setFileIds((current) => [...new Set([...current, ...fileIds])]);
    };

    const chooseTarget = (value: string) => {
        const [type, id] = value.split(':');
        sendForm.setData((data) => ({ ...data, type, id }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Upload')} />

            <div className="px-4 py-6">
                <Heading
                    title={t('Upload files')}
                    description={
                        max_file_size_mb > 0
                            ? t('Up to :max MB per file. Uploads can be paused and resume automatically after interruptions.', {
                                  max: max_file_size_mb,
                              })
                            : t('No size limit. Uploads can be paused and resume automatically after interruptions.')
                    }
                />

                <ChunkedUploadDashboard
                    maxFileSizeMb={max_file_size_mb}
                    partSizeMb={part_size_mb}
                    allowedExtensions={allowed_extensions}
                    onComplete={handleComplete}
                />

                {fileIds.length > 0 && (
                    <div className="bg-card mt-8 grid gap-6 rounded-xl border p-6">
                        <div>
                            <h2 className="text-xl font-semibold">{t('Send files')}</h2>
                            <p className="text-muted-foreground text-sm">
                                {t(':count uploaded files are ready to share.', { count: fileIds.length })}
                            </p>
                        </div>
                        {recent_targets.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {recent_targets.map((target) => (
                                    <button
                                        type="button"
                                        className="hover:bg-accent rounded-full border px-3 py-1 text-sm"
                                        key={`${target.type}:${target.id}`}
                                        onClick={() => chooseTarget(`${target.type}:${target.id}`)}
                                    >
                                        {target.name}
                                    </button>
                                ))}
                            </div>
                        )}
                        <select
                            className="bg-background h-10 rounded-md border px-3"
                            value={`${sendForm.data.type}:${sendForm.data.id}`}
                            onChange={(event) => chooseTarget(event.target.value)}
                        >
                            <option value="client:">{t('Choose a recipient')}</option>
                            <optgroup label={t('Clients')}>
                                {clients.map((client) => (
                                    <option key={`client:${client.id}`} value={`client:${client.id}`}>
                                        {client.name}
                                    </option>
                                ))}
                            </optgroup>
                            <optgroup label={t('Groups')}>
                                {groups.map((group) => (
                                    <option key={`group:${group.id}`} value={`group:${group.id}`}>
                                        {group.name}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                        {message_templates.length > 0 && (
                            <select
                                className="bg-background h-10 rounded-md border px-3"
                                defaultValue=""
                                onChange={(event) =>
                                    sendForm.setData(
                                        'message',
                                        message_templates.find((template) => template.id === Number(event.target.value))?.body ?? '',
                                    )
                                }
                            >
                                <option value="">{t('Use a saved message')}</option>
                                {message_templates.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <textarea
                            className="bg-background min-h-28 rounded-md border p-3"
                            placeholder={t('Optional message for the recipient')}
                            value={sendForm.data.message}
                            onChange={(event) => sendForm.setData('message', event.target.value)}
                        />
                        <button
                            className="bg-primary text-primary-foreground h-10 rounded-md px-4 disabled:opacity-50"
                            disabled={!sendForm.data.id || sendForm.processing}
                            onClick={() => {
                                sendForm.transform((data) => ({ ...data, file_ids: fileIds, id: Number(data.id) }));
                                sendForm.post(send_url);
                            }}
                        >
                            {t('Send files')}
                        </button>
                        <details className="border-t pt-4">
                            <summary className="cursor-pointer text-sm font-medium">{t('Save this message as a template')}</summary>
                            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                                <input
                                    className="bg-background h-10 rounded-md border px-3"
                                    placeholder={t('Template name')}
                                    value={templateForm.data.name}
                                    onChange={(event) => templateForm.setData('name', event.target.value)}
                                />
                                <button
                                    className="rounded-md border px-4"
                                    onClick={() => {
                                        templateForm.transform((data) => ({ ...data, body: sendForm.data.message }));
                                        templateForm.post(template_store_url);
                                    }}
                                >
                                    {t('Save template')}
                                </button>
                            </div>
                        </details>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
