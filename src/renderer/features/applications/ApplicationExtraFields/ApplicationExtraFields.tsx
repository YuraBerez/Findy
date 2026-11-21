import { useTranslation } from 'react-i18next'
import {
  CURRENCIES,
  SALARY_PERIODS,
  SOURCE_CHANNELS,
  sourceKey,
  sourceOfKey,
  WORK_FORMATS,
  type Currency,
  type SalaryPeriod,
  type WorkFormat,
} from '@domain/fields'
import { isHttpUrl } from '@domain/limits'
import { KNOWN_SITES, type CustomSite } from '@domain/sites'
import { Button, ExternalLinkIcon, Field, Select, TextField } from '@ui'
import { useFieldLabels } from '../../fields'
import type { FieldsFormState } from '../useFieldsForm'
import styles from './ApplicationExtraFields.module.css'

interface Props {
  form: FieldsFormState
  /** The user's job sites (spec 011), offered as sources */
  sites: readonly CustomSite[]
  onOpenLink(url: string): void
}

/** Spec 014 FR-010: salary, work format, location, source and contact in the details form. */
export function ApplicationExtraFields({ form, sites, onOpenLink }: Props) {
  const { t } = useTranslation()
  const labels = useFieldLabels()
  const { values } = form
  const contactLink = values.contactDetails.trim()

  // FR-005: a saved custom name stays selectable after its site was deleted or renamed
  const saved = sourceOfKey(values.source)
  const customNames = sites.map((site) => site.name)
  if (saved?.kind === 'custom' && !customNames.includes(saved.name)) customNames.push(saved.name)

  return (
    <div className={styles.fields}>
      <div className={styles.salary}>
        <TextField
          name="salaryMin"
          inputMode="numeric"
          label={t('fields.salaryFrom')}
          value={values.salaryMin}
          error={form.errorText('salaryMin')}
          autoComplete="off"
          onChange={(event) => form.set('salaryMin', event.target.value)}
        />
        <TextField
          name="salaryMax"
          inputMode="numeric"
          label={t('fields.salaryTo')}
          value={values.salaryMax}
          error={form.errorText('salaryMax')}
          autoComplete="off"
          onChange={(event) => form.set('salaryMax', event.target.value)}
        />
        <Field label={t('fields.currency')}>
          {(control) => (
            <Select
              {...control}
              block
              name="currency"
              value={values.currency}
              onChange={(event) => form.set('currency', event.target.value as Currency)}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('fields.period')}>
          {(control) => (
            <Select
              {...control}
              block
              name="period"
              value={values.period}
              onChange={(event) => form.set('period', event.target.value as SalaryPeriod)}
            >
              {SALARY_PERIODS.map((period) => (
                <option key={period} value={period}>
                  {t(`fields.periods.${period}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className={styles.pair}>
        <Field label={t('fields.workFormat')}>
          {(control) => (
            <Select
              {...control}
              block
              name="workFormat"
              value={values.workFormat}
              onChange={(event) => form.set('workFormat', event.target.value as WorkFormat | '')}
            >
              <option value="">{t('fields.notSet')}</option>
              {WORK_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {labels.workFormat(format)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <TextField
          name="location"
          label={t('fields.location')}
          hint={t('fields.locationHint')}
          value={values.location}
          error={form.errorText('location')}
          autoComplete="off"
          onChange={(event) => form.set('location', event.target.value)}
        />
      </div>

      <Field label={t('fields.source')}>
        {(control) => (
          <Select
            {...control}
            block
            name="source"
            value={values.source}
            onChange={(event) => form.set('source', event.target.value)}
          >
            <option value="">{t('fields.notSet')}</option>
            <optgroup label={t('fields.sourceGroups.sites')}>
              {KNOWN_SITES.map((site) => (
                <option key={site.id} value={sourceKey({ kind: 'site', id: site.id })}>
                  {site.name}
                </option>
              ))}
            </optgroup>
            {customNames.length > 0 && (
              <optgroup label={t('fields.sourceGroups.mySites')}>
                {customNames.map((name) => (
                  <option key={name} value={sourceKey({ kind: 'custom', name })}>
                    {name}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label={t('fields.sourceGroups.channels')}>
              {SOURCE_CHANNELS.map((id) => (
                <option key={id} value={sourceKey({ kind: 'channel', id })}>
                  {labels.channels[id]}
                </option>
              ))}
            </optgroup>
          </Select>
        )}
      </Field>

      <div className={styles.pair}>
        <TextField
          name="contactName"
          label={t('fields.contactName')}
          value={values.contactName}
          error={form.errorText('contactName')}
          autoComplete="off"
          onChange={(event) => form.set('contactName', event.target.value)}
        />
        <div>
          <TextField
            name="contactDetails"
            label={t('fields.contactDetails')}
            hint={t('fields.contactDetailsHint')}
            value={values.contactDetails}
            error={form.errorText('contactDetails')}
            autoComplete="off"
            onChange={(event) => form.set('contactDetails', event.target.value)}
          />
          {/* US-4.2: a link opens in the system browser */}
          {isHttpUrl(contactLink) && (
            <Button size="small" className={styles.open} onClick={() => onOpenLink(contactLink)}>
              <ExternalLinkIcon size={14} />
              {t('fields.openContact')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
