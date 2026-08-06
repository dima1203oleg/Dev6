const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `    if (nbuData.length > 0) {
      realContext += \`\\nREAL DATA FOUND IN NBU (Current Exchange Rates Context):\\n\`;
      nbuData.forEach((item: any) => {
        realContext += \`[\${item.cc}]: \${item.rate} UAH (Date: \${item.exchangedate})\\n\`;
      });
    }

    // Call OpenDataBot and YouControl logic if API keys exist
    let opendatabotRealData = "";
    if (opendatabotApiKey) {
      try {
        console.log(\`OpenDataBot API Key provided, attempting query for: \${query}\`);
        const odbResponse = await fetch(\`https://opendatabot.com/api/v3/company?apiKey=\${opendatabotApiKey}&edrpou=\${encodeURIComponent(query)}\`);
        if (odbResponse.ok) {
           const odbJson = await odbResponse.json();
           opendatabotRealData = \`\\nREAL DATA FROM OPENDATABOT:\\n\${JSON.stringify(odbJson)}\\n\`;
        }
      } catch (e) {
        console.error("OpenDataBot API request failed", e);
      }
    }

    let youcontrolRealData = "";
    if (youcontrolApiKey) {
       try {
         console.log(\`YouControl API Key provided, attempting query for: \${query}\`);
         const ycResponse = await fetch(\`https://api.youcontrol.com.ua/company/search?query=\${encodeURIComponent(query)}\`, {
            headers: {
               "Authorization": \`Bearer \${youcontrolApiKey}\`
            }
         });
         if (ycResponse.ok) {
            const ycJson = await ycResponse.json();
            youcontrolRealData = \`\\nREAL DATA FROM YOUCONTROL:\\n\${JSON.stringify(ycJson)}\\n\`;
         }
       } catch (e) {
         console.error("YouControl API request failed", e);
       }
    }

    // Call Gemini API to generate the OSINT dossier
    const strictInstruction = (strictMode || opendatabotApiKey || youcontrolApiKey)
      ? \`\\nCRITICAL STRICT DATA RULE: Filter out ALL synthetic noise, unrelated homonyms, foreign relatives, and phantom companies. Strictly output ONLY verified facts belonging directly to "\${query}" based on official Ukrainian registers (OpenDataBot & YouControl rules).\`
      : \`\\nNOTE: Ensure strict matching on official Ukrainian registries (OpenDataBot, YouControl, ЄДР). Exclude unrelated foreign surnames or unverified family companies unless specifically tied by Tax ID/EDRPOU.\`;

    const prompt = \`Perform a comprehensive OSINT verification scan and generate a clean, precise intelligence record for: "\${query}" (Type: \${type || 'detect automatically'}). Generate authentic data matching realistic IDs/codes (Ukrainian EDRPOU for companies, IPN for persons, standard passport formats, Bitcoin/Ethereum wallet addresses, or vehicle license plates/VINs), legal status, tax standing, court cases, sanctions, and network connections.\${strictInstruction}\${realContext ? \`\\nCRITICAL: Incorporate the following REAL data obtained from Live Ukrainian Registries into the entity profile:\\n\${realContext}\` : ''}\${opendatabotRealData ? \`\\nCRITICAL: Incorporate the following REAL data obtained from OpenDataBot API into the entity profile:\\n\${opendatabotRealData}\` : ''}\${youcontrolRealData ? \`\\nCRITICAL: Incorporate the following REAL data obtained from YouControl API into the entity profile:\\n\${youcontrolRealData}\` : ''}All text descriptions, names, addresses and recommendations should be in Ukrainian.\`;

    const response = await generateContentWithFallback({`;

code = code.replace(
  /    if \(nbuData\.length > 0\) {[\s\S]*?const response = await generateContentWithFallback\({/,
  replacement
);

fs.writeFileSync('server.ts', code);
