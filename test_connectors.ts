import { FOPConnector } from './server/connectors/FOPConnector';
import { CrtshConnector } from './server/connectors/CrtshConnector';

async function run() {
  const fop = new FOPConnector();
  const crt = new CrtshConnector();
  
  console.log("FOP invalid (00000000):", await fop.fetch('00000000').catch(e => e.message));
  console.log("FOP empty (12345678):", await fop.fetch('12345678').catch(e => e.message));
  console.log("CRT valid (privatbank.ua):", await crt.fetch('privatbank.ua').catch(e => e.message));
}
run();
