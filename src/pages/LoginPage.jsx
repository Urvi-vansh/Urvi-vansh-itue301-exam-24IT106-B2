export default function LoginPage() {
  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <section>
      <h2>Log in</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>{' '}
        <input id="email" name="email" type="email" autoComplete="email" required />
        <br />
        <label htmlFor="password">Password</label>{' '}
        <input id="password" name="password" type="password" autoComplete="current-password" required />
        <br />
        <button type="submit">Log in</button>
      </form>
    </section>
  );
}
