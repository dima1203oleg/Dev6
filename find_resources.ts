async function find() {
  const url = `https://data.gov.ua/api/3/action/package_search?q=${encodeURIComponent('Єдиний державний реєстр юридичних осіб')}&rows=5`;
  const res = await fetch(url);
  const body = await res.json();
  body.result.results.forEach((r: any) => {
    console.log("Package:", r.title, r.name);
    r.resources.forEach((res: any) => {
      console.log("  Resource:", res.name, res.id, res.format, res.datastore_active);
    });
  });
}
find();
