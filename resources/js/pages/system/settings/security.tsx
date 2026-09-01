import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { SaveButton } from '@/components/save-button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';
import { useFormatDate } from '@/hooks/use-format-date';
import AppLayout from '@/layouts/app-layout';

interface SecuritySettingsProps {
    two_factor_enforcement: string;
    password_min_length: number;
    password_reject_breached: boolean;
    password_min_length_floor: number;
    password_min_length_ceiling: number;
    staff_authentication: {
        total: number;
        two_factor_enrolled: number;
        passkey_enrolled: number;
        without_strong_authentication: number;
    };
    backup_history: Array<{
        status: string;
        name: string;
        bytes: number;
        message: string;
        recorded_at: string;
    }>;
    security_posture: {
        public_links_without_password: number;
        unlimited_public_links: number;
        expired_api_tokens: number;
        failed_jobs: number;
        failed_webhooks: number;
        malware_scanning: boolean;
        malware_fail_closed: boolean;
        malware_health: { enabled: boolean; reachable: boolean | null; version: string | null; signature_date: string | null };
        webhooks_configured: boolean;
    };
}

export default function SecuritySettings({
    two_factor_enforcement,
    password_min_length,
    password_reject_breached,
    password_min_length_floor,
    password_min_length_ceiling,
    staff_authentication,
    backup_history,
    security_posture,
}: SecuritySettingsProps) {
    const { t } = useTranslation();
    const { dateTime } = useFormatDate();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('Settings'),
            href: '/system/settings',
        },
        {
            title: t('Security'),
            href: '/system/settings/security',
        },
    ];

    const options: { value: string; label: string }[] = [
        { value: 'none', label: t('Nobody (optional for everyone)') },
        { value: 'staff', label: t('All system users') },
        { value: 'clients', label: t('All clients') },
        { value: 'all', label: t('Everyone') },
    ];

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        two_factor_enforcement: two_factor_enforcement,
        password_min_length: password_min_length,
        password_reject_breached: password_reject_breached,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('system-settings.security.update'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Security settings')} />

            <div className="px-4 py-6">
                <Heading title={t('Security settings')} description={t('Authentication requirements for this installation')} />

                <form onSubmit={submit} className="max-w-xl space-y-6">
                    <div className="grid gap-3 rounded-lg border p-4">
                        <div>
                            <p className="font-medium">{t('Staff authentication coverage')}</p>
                            <p className="text-muted-foreground text-sm">
                                {t(':protected of :total staff accounts have two-factor authentication or a passkey.', {
                                    protected: staff_authentication.total - staff_authentication.without_strong_authentication,
                                    total: staff_authentication.total,
                                })}
                            </p>
                        </div>
                        <dl className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                                <dt className="text-muted-foreground">{t('Two-factor')}</dt>
                                <dd className="font-semibold">{staff_authentication.two_factor_enrolled}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">{t('Passkeys')}</dt>
                                <dd className="font-semibold">{staff_authentication.passkey_enrolled}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">{t('Unprotected')}</dt>
                                <dd className={staff_authentication.without_strong_authentication > 0 ? 'font-semibold text-red-600' : 'font-semibold'}>
                                    {staff_authentication.without_strong_authentication}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="grid gap-3 rounded-lg border p-4">
                        <p className="font-medium">{t('Security posture')}</p>
                        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                            {[
                                [t('Links without passwords'), security_posture.public_links_without_password],
                                [t('Unlimited links'), security_posture.unlimited_public_links],
                                [t('Expired API tokens'), security_posture.expired_api_tokens],
                                [t('Failed jobs'), security_posture.failed_jobs],
                                [t('Failed webhooks'), security_posture.failed_webhooks],
                            ].map(([label, value]) => (
                                <div key={String(label)}>
                                    <dt className="text-muted-foreground">{label}</dt>
                                    <dd className={Number(value) > 0 ? 'font-semibold text-amber-600' : 'font-semibold'}>{value}</dd>
                                </div>
                            ))}
                            <div>
                                <dt className="text-muted-foreground">{t('Upload scanning')}</dt>
                                <dd className={security_posture.malware_scanning && security_posture.malware_fail_closed ? 'font-semibold' : 'font-semibold text-red-600'}>
                                    {security_posture.malware_scanning
                                        ? security_posture.malware_health.reachable === false
                                            ? t('Unavailable')
                                            : security_posture.malware_fail_closed
                                            ? t('Fail closed')
                                            : t('Fail open')
                                        : t('Disabled')}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="grid gap-3 rounded-lg border p-4">
                        <div>
                            <p className="font-medium">{t('Backup activity')}</p>
                            <p className="text-muted-foreground text-sm">{t('Results reported by the production backup and off-site copy scripts.')}</p>
                        </div>
                        {backup_history.length === 0 ? (
                            <p className="text-muted-foreground text-sm">{t('No backup result has been reported yet.')}</p>
                        ) : (
                            <ul className="space-y-2 text-sm">
                                {backup_history.map((entry, index) => (
                                    <li key={`${entry.recorded_at}-${index}`} className="flex items-start justify-between gap-4">
                                        <span>
                                            <span className="font-medium">{entry.name}</span>
                                            <span className="text-muted-foreground"> · {entry.status}</span>
                                        </span>
                                        <time className="text-muted-foreground whitespace-nowrap">{dateTime(entry.recorded_at)}</time>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="two_factor_enforcement">{t('Require two-factor authentication')}</Label>

                        <Select value={data.two_factor_enforcement} onValueChange={(value) => setData('two_factor_enforcement', value)}>
                            <SelectTrigger id="two_factor_enforcement" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <p className="text-muted-foreground text-sm">
                            {t(
                                'Accounts covered by this requirement must set up two-factor authentication before they can continue using the application.',
                            )}
                        </p>

                        <InputError className="mt-2" message={errors.two_factor_enforcement} />
                    </div>

                    <div className="space-y-6 border-t pt-6">
                        <Heading title={t('Passwords')} description={t('Applies whenever a password is chosen, not when one is used to sign in')} />

                        <div className="grid gap-2">
                            <Label htmlFor="password_min_length">{t('Minimum length')}</Label>
                            <Input
                                id="password_min_length"
                                type="number"
                                min={password_min_length_floor}
                                max={password_min_length_ceiling}
                                className="max-w-32"
                                value={data.password_min_length}
                                onChange={(e) => setData('password_min_length', Number(e.target.value))}
                            />
                            <p className="text-muted-foreground text-sm">
                                {t(
                                    'Length is the single biggest factor in how hard a password is to guess, which is why there are no "must contain a capital letter" rules here — they push people towards predictable substitutions and shorter passwords.',
                                )}
                            </p>
                            <p className="text-muted-foreground text-sm">
                                {t('Existing passwords are never re-checked, so raising this only affects passwords chosen from now on.')}
                            </p>
                            <InputError className="mt-2" message={errors.password_min_length} />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="password_reject_breached"
                                    checked={data.password_reject_breached}
                                    onCheckedChange={(checked) => setData('password_reject_breached', checked === true)}
                                />
                                <Label htmlFor="password_reject_breached" className="font-normal">
                                    {t('Reject passwords found in known data breaches')}
                                </Label>
                            </div>
                            <p className="text-muted-foreground text-sm">
                                {t(
                                    'Checks new passwords against the Have I Been Pwned breach corpus. The password itself never leaves this server — only the first five characters of its hash are sent.',
                                )}
                            </p>
                            <p className="text-muted-foreground text-sm">
                                {t(
                                    'Turn this off only if this server should make no outbound requests. If the service cannot be reached the password is accepted anyway, so an offline installation is never blocked by it.',
                                )}
                            </p>
                            <InputError className="mt-2" message={errors.password_reject_breached} />
                        </div>
                    </div>

                    <SaveButton processing={processing} recentlySuccessful={recentlySuccessful} />
                </form>
            </div>
        </AppLayout>
    );
}
