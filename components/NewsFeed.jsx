export default function NewsFeed({ items=[] }){
  return (
    <div className="card p-4">
      <h3 className="font-bold">Market News</h3>
      <ul className="mt-2 space-y-2">
        {items.map((n,i)=> (
          <li key={i} className="border-b border-dashed border-gray-200 dark:border-[#223355] pb-2">
            <a href={n.url} target="_blank" rel="noreferrer" className="link">{n.title}</a>
            <div className="text-xs text-gray-500 dark:text-gray-400">{n.source} • {n.datetime? new Date(n.datetime).toLocaleString(): ''}</div>
          </li>
        ))}
        {items.length===0 && <li className="text-sm text-gray-500 dark:text-gray-400">No recent articles</li>}
      </ul>
    </div>
  )
}
