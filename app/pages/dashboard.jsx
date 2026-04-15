export default function Dashboard({ loaderData, actionData, params, matches }) {
  return (
    <main>
      <h1>Dashboard</h1>
      <p>Loader Data: {JSON.stringify(loaderData)}</p>
      <p>Action Data: {JSON.stringify(actionData)}</p>
      <p>Route Parameters: {JSON.stringify(params)}</p>
      <p>Matched Routes: {JSON.stringify(matches)}</p>
    </main>
  );
}
