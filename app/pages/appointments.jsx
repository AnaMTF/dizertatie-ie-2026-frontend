export default function Appointments({
  loaderData,
  actionData,
  params,
  matches,
}) {
  return (
    <div>
      <h1>Appointments</h1>
      <p>Loader Data: {JSON.stringify(loaderData)}</p>
      <p>Action Data: {JSON.stringify(actionData)}</p>
      <p>Route Parameters: {JSON.stringify(params)}</p>
      <p>Matched Routes: {JSON.stringify(matches)}</p>
    </div>
  );
}
