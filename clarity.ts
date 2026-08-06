async function fetchClarity(code: string) {
  const url = `https://clarity-project.info/edr/${code}`;
  const res = await fetch(url);
  const text = await res.text();
  console.log("Status:", res.status);
  
  const titleMatch = text.match(/<meta property="og:title" content="(.*?)"/);
  console.log("Title:", titleMatch ? titleMatch[1] : null);
}
fetchClarity('14360570');
