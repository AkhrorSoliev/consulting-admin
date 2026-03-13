export default function ChannelStats({ stats }) {
  return (
    <div className="stats stats-vertical sm:stats-horizontal shadow border border-base-300 bg-base-100">
      <div className="stat">
        <div className="stat-title">Jami</div>
        <div className="stat-value text-primary">{stats.total}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Active</div>
        <div className="stat-value">{stats.active}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Inactive</div>
        <div className="stat-value">{stats.inactive}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Links generated</div>
        <div className="stat-value">{stats.linksGeneratedTotal}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Links sent</div>
        <div className="stat-value">{stats.linksDispatchedTotal}</div>
      </div>
    </div>
  );
}
