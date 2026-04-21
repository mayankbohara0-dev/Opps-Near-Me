import google from 'googlethis';

async function test() {
  const options = {
    page: 0, 
    safe: false, 
    parse_ads: false, 
    additional_params: { 
      hl: 'en' 
    }
  };

  try {
    const response = await google.search('linkedin intership in india student entry level', options);
    console.log(response.results.length);
    const topResults = response.results.slice(0, 3).map((r: any) => `- Title: ${r.title}\n  Description: ${r.description}\n  Link: ${r.url}`).join("\n\n");
    console.log(topResults);
  } catch (err) {
    console.error("googlethis failed", err);
  }
}

test();
