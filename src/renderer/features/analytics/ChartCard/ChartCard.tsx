import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, DataTable, Section } from '@ui'

interface Props {
  title: string
  /** The same numbers as the chart (FR-026) */
  table: { columns: string[]; rows: (string | number)[][] }
  children: ReactNode
}

/** A titled chart with a "Show as table" toggle (FR-026). */
export function ChartCard({ title, table, children }: Props) {
  const { t } = useTranslation()
  const [asTable, setAsTable] = useState(false)
  // A wrapper, so cards in a grid are not adjacent sections with a top margin
  return (
    <div>
      <Section
        title={title}
        actions={
          <Button variant="ghost" size="small" onClick={() => setAsTable(!asTable)}>
            {asTable ? t('analytics.showChart') : t('analytics.showTable')}
          </Button>
        }
      >
        {asTable ? <DataTable caption={title} {...table} /> : children}
      </Section>
    </div>
  )
}
