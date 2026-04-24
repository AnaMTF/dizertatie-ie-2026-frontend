export default function AiScan({ loaderData, actionData, params, matches }) {
  return (
    <div className="px-9 pt-6">
      <h1>AI Scan</h1>
      <p>Loader Data: {JSON.stringify(loaderData)}</p>
      <p>Action Data: {JSON.stringify(actionData)}</p>
      <p>Route Parameters: {JSON.stringify(params)}</p>
      <p>Matched Routes: {JSON.stringify(matches)}</p>
    </div>
  );
}
