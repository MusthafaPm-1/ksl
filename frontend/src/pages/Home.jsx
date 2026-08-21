function Home() {
  return (
    <div className="page">
      <section className="hero">
        <h1>Kocheri Super League</h1>

        <p>
          Follow live scores, fixtures, results,
          standings and teams.
        </p>

        <div className="hero-buttons">
          <a href="/live" className="btn btn-primary">
            View Live Matches
          </a>
          <a href="/fixtures" className="btn btn-secondary">
            View Fixtures
          </a>
        </div>
      </section>

      <section className="section">
        <h2>Live Matches</h2>

        <div className="empty-card">
          <p>No matches are currently live.</p>
        </div>
      </section>

      <section className="section">
        <h2>Upcoming Matches</h2>

        <div className="empty-card">
          <p>No upcoming matches.</p>
        </div>

        <div>
          <Link to="/teams" className="btn btn-secondary">
            View Teams
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;