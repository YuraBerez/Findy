import styles from './DataTable.module.css'

interface Props {
  caption: string
  columns: string[]
  /** The first cell of each row is its header */
  rows: (string | number)[][]
}

/** A plain data table, e.g. the numbers behind a chart (spec 005 FR-026). */
export function DataTable({ caption, columns, rows }: Props) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([head, ...cells], i) => (
            <tr key={i}>
              <th scope="row">{head}</th>
              {cells.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
