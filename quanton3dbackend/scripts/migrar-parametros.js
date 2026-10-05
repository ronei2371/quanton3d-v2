/**
 * MIGRACAO UNICA DA COLECAO `parametros`
 * Fonte: planilha mestra "Atualizacao de parametros - ronei.ods" (05/10/2026)
 *
 * COMO USAR (shell do Render, dentro de quanton3dbackend)
 *   node scripts/migrar-parametros.js              -> SIMULACAO, nao grava nada
 *   node scripts/migrar-parametros.js --aplicar    -> grava de verdade
 *
 * COMO DESFAZER (se algo der errado)
 *   node scripts/migrar-parametros.js --desfazer
 *   Restaura a partir da colecao `parametros_backup_2026_10_05`, que este
 *   proprio script cria no banco antes de escrever qualquer coisa.
 *
 * O QUE FAZ
 *   UPDATE  192  corrige exposicao, camadas, altura, formato e grafia do nome
 *   INSERT   12  impressoras que a planilha tem e o banco nao
 *   DELETE  114  registros duplicados do mesmo grupo resina+impressora
 *   RENAME   20  ATHOM CASTABLE 2 -> ATHOM CASTABLE / GENGIVA -> ATHOM GENGIVA
 *   1275 - 114 + 12 = 1173 registros no final
 *
 * O QUE NAO TOCA (86 registros, decisao pendente do Ronei)
 *   RPG 4K, VELVET SKIN, PHOTON SE, PHOTON CLASSICA, PHOTON M3 4K,
 *   SATURN 5 ULTRA, SPARK/Mars, LOWSMELL/Mars,
 *   ATHOM CASTABLE e ATHOM GENGIVA (so o nome e unificado, valores ficam)
 *
 * SEGURANCA
 *   - Copia a colecao inteira para parametros_backup_2026_10_05 antes de escrever.
 *   - Exige que a colecao tenha exatamente 1275 documentos. Se mudou, aborta.
 *   - Exige que todo _id do plano exista. Se faltar um, aborta.
 *   - Sem --aplicar nao grava absolutamente nada.
 *
 * O plano foi calculado e simulado contra o backup de 05/10/2026 antes de ser
 * gerado: 0 erros de aplicacao, 0 problemas fora do escopo, 0 fotos perdidas.
 */

import mongoose from 'mongoose';

const APLICAR  = process.argv.includes('--aplicar');
const DESFAZER = process.argv.includes('--desfazer');
const COL_BACKUP = 'parametros_backup_2026_10_05';
const TOTAL_ESPERADO = 1275;

// Operacoes em formato compacto, na ordem dos campos:
//   U = [_id, resina, impressora, exposicaoNormal, exposicaoBase, camadasBase]
//       (fotoImpressora NAO e tocada: o registro que sobrevive ja e, por regra,
//        o que tem foto - conferido, 0 casos precisariam de copia)
//   I = [resina, impressora, exposicaoNormal, exposicaoBase, camadasBase]
//   D = [_id, ...]
//   R = [[_id, resinaNova], ...]
const OPS = {"U":[["69eeef66b704e6d9ecbcf7f8","ATHOM DENTAL","Photon S","8","70","10"],["69eeef66b704e6d9ecbcf7fa","ATHOM DENTAL","Photon Mono","2","35","6"],["69eeef66b704e6d9ecbcf7fb","ATHOM DENTAL","Photon Mono 4K","1.9","40","5"],["69eeef66b704e6d9ecbcf7fc","ATHOM DENTAL","Photon Mono X 4K","1.7","30","5"],["69eeef66b704e6d9ecbcf7fd","ATHOM DENTAL","Photon Mono X 6K","2","30","5"],["69eeef66b704e6d9ecbcf7ff","ATHOM DENTAL","Photon M3 Max","1.9","35","4"],["69eeef66b704e6d9ecbcf800","ATHOM DENTAL","Photon Mono M5s","1.8","35","4"],["69eeef66b704e6d9ecbcf801","ATHOM DENTAL","Mars","8","50","8"],["69eeef66b704e6d9ecbcf802","ATHOM DENTAL","Mars 2 Pro","1.8","35","5"],["69eeef66b704e6d9ecbcf803","ATHOM DENTAL","Mars 3 Pro","1.9","35","5"],["69eeef66b704e6d9ecbcf804","ATHOM DENTAL","Mars 4 Ultra","1.5","50","5"],["69eeef66b704e6d9ecbcf805","ATHOM DENTAL","Mars 5 Ultra","1.7","40","6"],["69eeef66b704e6d9ecbcf806","ATHOM DENTAL","Saturn","1.9","20","5"],["69eeef66b704e6d9ecbcf807","ATHOM DENTAL","Saturn 2","1.9","35","5"],["69eeef66b704e6d9ecbcf808","ATHOM DENTAL","Saturn 3","2","25","5"],["69eeef66b704e6d9ecbcf809","ATHOM DENTAL","Saturn 3 Ultra","1.8","20","5"],["69eeef66b704e6d9ecbcf80a","ATHOM DENTAL","Saturn 4 Ultra","1.8","35","4"],["69eeef66b704e6d9ecbcf80c","ATHOM DENTAL","LD-002R","7","80","8"],["69eeef66b704e6d9ecbcf80d","ATHOM DENTAL","LD-002H","1.5","25","5"],["69eeef66b704e6d9ecbcf80b","ATHOM DENTAL","LD-006","1.9","40","5"],["69eeef66b704e6d9ecbcf80f","ATHOM DENTAL","HALOT-ONE","1.8","35","5"],["69eeef66b704e6d9ecbcf80e","ATHOM DENTAL","HALOT-SKY","1.3","35","5"],["69eeef66b704e6d9ecbcf810","ATHOM DENTAL","HALOT-R6","1.3","35","5"],["69eeef66b704e6d9ecbcf7b0","ATHOM ALINHADORES","Photon S","6","60","8"],["69eeef66b704e6d9ecbcf7b2","ATHOM ALINHADORES","Photon Mono","1.6","30","6"],["69eeef66b704e6d9ecbcf7b3","ATHOM ALINHADORES","Photon Mono 4K","1.6","30","6"],["69eeef66b704e6d9ecbcf7b4","ATHOM ALINHADORES","Photon Mono X 4K","1.8","30","5"],["69eeef66b704e6d9ecbcf7b5","ATHOM ALINHADORES","Photon Mono X 6K","2","35","5"],["69eeef66b704e6d9ecbcf7b7","ATHOM ALINHADORES","Photon M3 Max","1.8","38","5"],["69eeef66b704e6d9ecbcf7b8","ATHOM ALINHADORES","Photon Mono M5s","1.7","33","5"],["69eeef66b704e6d9ecbcf813","ATHOM WASHABLE","Photon S","6","70","8"],["69eeef66b704e6d9ecbcf815","ATHOM WASHABLE","Photon Mono","1.8","30","6"],["69eeef66b704e6d9ecbcf816","ATHOM WASHABLE","Photon Mono 4K","1.6","30","5"],["69eeef66b704e6d9ecbcf817","ATHOM WASHABLE","Photon Mono X 4K","1.9","35","5"],["69eeef66b704e6d9ecbcf818","ATHOM WASHABLE","Photon Mono X 6K","2.1","30","5"],["69eeef66b704e6d9ecbcf81a","ATHOM WASHABLE","Photon M3 Max","1.9","45","4"],["69eeef66b704e6d9ecbcf81b","ATHOM WASHABLE","Photon Mono M5s","1.8","30","5"],["69eeef66b704e6d9ecbcf6a5","PYROBLAST","Photon S","8","70","9"],["69eeef66b704e6d9ecbcf6a7","PYROBLAST","Photon Mono","1.7","35","6"],["69eeef66b704e6d9ecbcf6a8","PYROBLAST","Photon Mono 4K","1.9","40","6"],["69eeef66b704e6d9ecbcf6a9","PYROBLAST","Photon Mono X 4K","1.9","38","5"],["69eeef66b704e6d9ecbcf6aa","PYROBLAST","Photon Mono X 6K","2","38","6"],["69eeef66b704e6d9ecbcf6ac","PYROBLAST","Photon M3 Max","1.9","38","4"],["69eeef66b704e6d9ecbcf6ad","PYROBLAST","Photon Mono M5s","1.7","25","5"],["69eeef66b704e6d9ecbcf6ae","PYROBLAST","Mars","8","70","10"],["69eeef66b704e6d9ecbcf6af","PYROBLAST","Mars 2 Pro","1.8","35","5"],["69eeef66b704e6d9ecbcf6b0","PYROBLAST","Mars 3 Pro","1.8","35","5"],["69eeef66b704e6d9ecbcf6b1","PYROBLAST","Mars 3 Ultra","1.7","35","5"],["69eeef66b704e6d9ecbcf6b2","PYROBLAST","Saturn","1.9","35","6"],["69eeef66b704e6d9ecbcf6b3","PYROBLAST","Saturn 2","2","40","5"],["69eeef66b704e6d9ecbcf6b4","PYROBLAST","Saturn 3","1.8","25","5"],["69eeef66b704e6d9ecbcf6b5","PYROBLAST","Saturn 3 Ultra","1.7","30","6"],["69eeef66b704e6d9ecbcf6b7","PYROBLAST","LD-002R","7","65","8"],["69eeef66b704e6d9ecbcf6b8","PYROBLAST","LD-002H","1.5","25","5"],["69eeef66b704e6d9ecbcf6b6","PYROBLAST","LD-006","2.1","40","5"],["69eeef66b704e6d9ecbcf6ba","PYROBLAST","HALOT-ONE","1.7","30","5"],["69eeef66b704e6d9ecbcf6b9","PYROBLAST","HALOT-SKY","1.3","35","6"],["69eeef66b704e6d9ecbcf6ed","SPIN+","Photon S","6","70","8"],["69eeef66b704e6d9ecbcf6ef","SPIN+","Photon Mono","1.7","35","6"],["69eeef66b704e6d9ecbcf6f0","SPIN+","Photon Mono 4K","1.9","40","6"],["69eeef66b704e6d9ecbcf6f1","SPIN+","Photon Mono X 4K","1.8","40","5"],["69eeef66b704e6d9ecbcf6f2","SPIN+","Photon Mono X 6K","1.9","38","5"],["69eeef66b704e6d9ecbcf6f4","SPIN+","Photon M3 Max","1.9","35","4"],["69eeef66b704e6d9ecbcf6f5","SPIN+","Photon Mono M5s","1.8","20","5"],["69eeef66b704e6d9ecbcf6f6","SPIN+","Mars","8","80","8"],["69eeef66b704e6d9ecbcf6f7","SPIN+","Mars 2 Pro","1.8","35","6"],["69eeef66b704e6d9ecbcf6f8","SPIN+","Mars 3 Pro","1.95","35","5"],["69eeef66b704e6d9ecbcf6f9","SPIN+","Mars 3 Ultra","1.8","35","5"],["69eeef66b704e6d9ecbcf6fa","SPIN+","Saturn","1.9","35","6"],["69eeef66b704e6d9ecbcf6fb","SPIN+","Saturn 2","2","35","5"],["69eeef66b704e6d9ecbcf6fc","SPIN+","Saturn 3","1.8","25","5"],["69eeef66b704e6d9ecbcf6fd","SPIN+","Saturn 3 Ultra","1.7","27","5"],["69eeef66b704e6d9ecbcf6ff","SPIN+","LD-002R","8","65","10"],["69eeef66b704e6d9ecbcf700","SPIN+","LD-002H","1.5","30","5"],["69eeef66b704e6d9ecbcf6fe","SPIN+","LD-006","1.9","35","6"],["69eeef66b704e6d9ecbcf702","SPIN+","HALOT-ONE","1.9","30","5"],["69eeef66b704e6d9ecbcf701","SPIN+","HALOT-SKY","1.4","45","4"],["69eeef66b704e6d9ecbcf705","POSEIDON","Photon S","6","70","10"],["69eeef66b704e6d9ecbcf707","POSEIDON","Photon Mono","1.8","35","6"],["69eeef66b704e6d9ecbcf708","POSEIDON","Photon Mono 4K","1.8","30","5"],["69eeef66b704e6d9ecbcf709","POSEIDON","Photon Mono X 4K","1.9","35","5"],["69eeef66b704e6d9ecbcf70a","POSEIDON","Photon Mono X 6K","1.8","30","5"],["69eeef66b704e6d9ecbcf70c","POSEIDON","Photon M3 Max","1.8","45","5"],["69eeef66b704e6d9ecbcf70d","POSEIDON","Photon Mono M5s","1.7","25","4"],["69eeef66b704e6d9ecbcf70e","POSEIDON","Mars","8","80","10"],["69eeef66b704e6d9ecbcf70f","POSEIDON","Mars 2 Pro","1.75","35","5"],["69eeef66b704e6d9ecbcf710","POSEIDON","Mars 3 Pro","1.8","35","5"],["69eeef66b704e6d9ecbcf711","POSEIDON","Mars 3 Ultra","1.7","35","4"],["69eeef66b704e6d9ecbcf712","POSEIDON","Saturn","1.8","35","5"],["69eeef66b704e6d9ecbcf713","POSEIDON","Saturn 2","2.2","40","5"],["69eeef66b704e6d9ecbcf714","POSEIDON","Saturn 3","2.1","38","5"],["69eeef66b704e6d9ecbcf715","POSEIDON","Saturn 3 Ultra","1.6","30","5"],["69eeef66b704e6d9ecbcf717","POSEIDON","LD-002R","6","70","8"],["69eeef66b704e6d9ecbcf718","POSEIDON","LD-002H","1.7","35","5"],["69eeef66b704e6d9ecbcf716","POSEIDON","LD-006","1.9","35","6"],["69eeef66b704e6d9ecbcf71a","POSEIDON","HALOT-ONE","1.8","40","5"],["69eeef66b704e6d9ecbcf719","POSEIDON","HALOT-SKY","1.3","35","5"],["69eeef66b704e6d9ecbcf788","LOWSMELL","Mars 2 Pro","1.7","30","5"],["69eeef66b704e6d9ecbcf789","LOWSMELL","Mars 3 Pro","1.7","35","5"],["69eeef66b704e6d9ecbcf78a","LOWSMELL","Mars 3 Ultra","1.7","30","5"],["69eeef66b704e6d9ecbcf78b","LOWSMELL","Saturn","1.9","35","5"],["69eeef66b704e6d9ecbcf78c","LOWSMELL","Saturn 2","2.2","40","5"],["69eeef66b704e6d9ecbcf78d","LOWSMELL","Saturn 3","2","35","5"],["69eeef66b704e6d9ecbcf78e","LOWSMELL","Saturn 3 Ultra","2","30","6"],["69eeef66b704e6d9ecbcf78f","LOWSMELL","Saturn 4 Ultra","1.6","35","4"],["69eeef66b704e6d9ecbcf792","LOWSMELL","LD-002R","6","70","7"],["69eeef66b704e6d9ecbcf793","LOWSMELL","LD-002H","1.7","30","5"],["69eeef66b704e6d9ecbcf791","LOWSMELL","LD-006","1.9","40","5"],["69eeef66b704e6d9ecbcf795","LOWSMELL","HALOT-ONE","1.9","38","5"],["69eeef66b704e6d9ecbcf794","LOWSMELL","HALOT-SKY","1.4","35","5"],["69eeef66b704e6d9ecbcf740","SPARK","Mars 2 Pro","1.5","30","5"],["69eeef66b704e6d9ecbcf741","SPARK","Mars 3 Pro","1.6","25","4"],["69eeef66b704e6d9ecbcf742","SPARK","Mars 3 Ultra","1.6","25","4"],["69eeef66b704e6d9ecbcf743","SPARK","Saturn","1.7","25","5"],["69eeef66b704e6d9ecbcf744","SPARK","Saturn 2","1.9","20","5"],["69eeef66b704e6d9ecbcf745","SPARK","Saturn 3","1.8","25","5"],["69eeef66b704e6d9ecbcf746","SPARK","Saturn 3 Ultra","1.4","20","4"],["69eeef66b704e6d9ecbcf748","SPARK","LD-002R","5.5","55","10"],["69eeef66b704e6d9ecbcf749","SPARK","LD-002H","1.5","25","5"],["69eeef66b704e6d9ecbcf747","SPARK","LD-006","1.55","30","4"],["69eeef66b704e6d9ecbcf74b","SPARK","HALOT-ONE","1.7","30","4"],["69eeef66b704e6d9ecbcf74a","SPARK","HALOT-SKY","1.4","30","4"],["69eeef66b704e6d9ecbcf735","ALCHEMIST","Photon S","6","50","10"],["69eeef66b704e6d9ecbcf737","ALCHEMIST","Photon Mono","1.8","35","5"],["69eeef66b704e6d9ecbcf738","ALCHEMIST","Photon Mono 4K","1.5","30","6"],["69eeef66b704e6d9ecbcf739","ALCHEMIST","Photon Mono X 4K","1.7","30","5"],["69eeef66b704e6d9ecbcf73a","ALCHEMIST","Photon Mono X 6K","1.7","30","5"],["69eeef66b704e6d9ecbcf73c","ALCHEMIST","Photon M3 Max","1.7","35","6"],["69eeef66b704e6d9ecbcf73d","ALCHEMIST","Photon Mono M5s","1.7","20","6"],["69eeef66b704e6d9ecbcf73e","ALCHEMIST","Photon Mono M5s Pro","1.8","20","6"],["69eeef66b704e6d9ecbcf76f","ALCHEMIST","Mars","6","55","8"],["69eeef66b704e6d9ecbcf770","ALCHEMIST","Mars 2 Pro","1.6","30","5"],["69eeef66b704e6d9ecbcf771","ALCHEMIST","Mars 3 Pro","1.5","25","5"],["69eeef66b704e6d9ecbcf772","ALCHEMIST","Mars 3 Ultra","1.6","20","5"],["69eeef66b704e6d9ecbcf773","ALCHEMIST","Saturn","1.7","20","5"],["69eeef66b704e6d9ecbcf774","ALCHEMIST","Saturn 2","1.8","20","5"],["69eeef66b704e6d9ecbcf775","ALCHEMIST","Saturn 3","1.8","20","6"],["69eeef66b704e6d9ecbcf776","ALCHEMIST","Saturn 3 Ultra","1.6","18","6"],["69eeef66b704e6d9ecbcf760","ALCHEMIST","LD-002R","6.5","55","8"],["69eeef66b704e6d9ecbcf761","ALCHEMIST","LD-002H","1.4","25","6"],["69eeef66b704e6d9ecbcf75f","ALCHEMIST","LD-006","1.8","30","5"],["69eeef66b704e6d9ecbcf763","ALCHEMIST","HALOT-ONE","1.7","35","6"],["69eeef66b704e6d9ecbcf762","ALCHEMIST","HALOT-SKY","1.4","30","6"],["69eeef66b704e6d9ecbcf6bb","ALCHEMIST","Sonic Mini 4K","1.9","25","5"],["69eeef66b704e6d9ecbcf6d5","IRON","Photon S","6.5","55","10"],["69eeef66b704e6d9ecbcf6d7","IRON","Photon Mono","1.6","25","5"],["69eeef66b704e6d9ecbcf6d8","IRON","Photon Mono 4K","1.7","25","5"],["69eeef66b704e6d9ecbcf6d9","IRON","Photon Mono X 4K","1.7","25","5"],["69eeef66b704e6d9ecbcf6da","IRON","Photon Mono X 6K","1.7","25","5"],["69eeef66b704e6d9ecbcf6dc","IRON","Photon M3 Max","1.6","25","5"],["69eeef66b704e6d9ecbcf6dd","IRON","Photon Mono M5s","1.7","25","5"],["69eeef66b704e6d9ecbcf6de","IRON","Mars","6.1","60","10"],["69eeef66b704e6d9ecbcf6df","IRON","Mars 2 Pro","1.7","25","5"],["69eeef66b704e6d9ecbcf6e0","IRON","Mars 3 Pro","1.5","25","5"],["69eeef66b704e6d9ecbcf6e1","IRON","Mars 3 Ultra","1.5","25","6"],["69eeef66b704e6d9ecbcf6e2","IRON","Saturn","1.7","25","6"],["69eeef66b704e6d9ecbcf6e3","IRON","Saturn 2","1.8","25","6"],["69eeef66b704e6d9ecbcf6e4","IRON","Saturn 3","1.6","25","6"],["69eeef66b704e6d9ecbcf6e5","IRON","Saturn 3 Ultra","1.5","25","6"],["69eeef66b704e6d9ecbcf6e7","IRON","LD-002R","7","25","8"],["69eeef66b704e6d9ecbcf6e8","IRON","LD-002H","1.7","25","6"],["69eeef66b704e6d9ecbcf6e6","IRON","LD-006","1.6","25","6"],["69eeef66b704e6d9ecbcf6ea","IRON","HALOT-ONE","1.7","25","6"],["69eeef66b704e6d9ecbcf6e9","IRON","HALOT-SKY","1.7","25","6"],["69eeef66b704e6d9ecbcf6bd","IRON 70/30","Photon S","8.2","60","10"],["69eeef66b704e6d9ecbcf6bf","IRON 70/30","Photon Mono","1.8","35","6"],["69eeef66b704e6d9ecbcf6c0","IRON 70/30","Photon Mono 4K","1.8","40","6"],["69eeef66b704e6d9ecbcf6c1","IRON 70/30","Photon Mono X 4K","1.6","35","6"],["69eeef66b704e6d9ecbcf6c2","IRON 70/30","Photon Mono X 6K","1.7","25","6"],["69eeef66b704e6d9ecbcf6c4","IRON 70/30","Photon M3 Max","1.7","30","6"],["69eeef66b704e6d9ecbcf6c5","IRON 70/30","Photon Mono M5s","1.6","15","6"],["69eeef66b704e6d9ecbcf6cf","IRON 70/30","LD-002R","6","60","8"],["69eeef66b704e6d9ecbcf6d0","IRON 70/30","LD-002H","1.6","30","5"],["69eeef66b704e6d9ecbcf6ce","IRON 70/30","LD-006","1.8","65","5"],["69eeef66b704e6d9ecbcf6d2","IRON 70/30","HALOT-ONE","1.7","45","6"],["69eeef66b704e6d9ecbcf6d1","IRON 70/30","HALOT-SKY","1.5","30","6"],["69eeef66b704e6d9ecbcf6d3","IRON 70/30","Sonic Mini 4K","2.2","35","6"],["69eeef66b704e6d9ecbcf74e","FLEXFORM","Photon S","8","70","10"],["69eeef66b704e6d9ecbcf750","FLEXFORM","Photon Mono","2","35","6"],["69eeef66b704e6d9ecbcf751","FLEXFORM","Photon Mono 4K","1.9","40","6"],["69eeef66b704e6d9ecbcf752","FLEXFORM","Photon Mono X 4K","1.7","30","6"],["69eeef66b704e6d9ecbcf753","FLEXFORM","Photon Mono X 6K","1.75","30","6"],["69eeef66b704e6d9ecbcf755","FLEXFORM","Photon M3 Max","2.1","45","6"],["69eeef66b704e6d9ecbcf756","FLEXFORM","Photon Mono M5s","2","25","6"],["69eeef66b704e6d9ecbcf757","FLEXFORM","Mars","8","70","10"],["69eeef66b704e6d9ecbcf758","FLEXFORM","Mars 2 Pro","1.8","35","5"],["69eeef66b704e6d9ecbcf759","FLEXFORM","Mars 3 Pro","1.95","35","5"],["69eeef66b704e6d9ecbcf75a","FLEXFORM","Mars 3 Ultra","1.9","35","6"],["69eeef66b704e6d9ecbcf75b","FLEXFORM","Saturn","2","40","6"],["69eeef66b704e6d9ecbcf75c","FLEXFORM","Saturn 2","1.8","20","5"],["69eeef66b704e6d9ecbcf75d","FLEXFORM","Saturn 3","1.8","25","5"],["69eeef66b704e6d9ecbcf75e","FLEXFORM","Saturn 3 Ultra","1.3","22","6"]],"I":[["ATHOM DENTAL","Shuffle","7.7","50","8"],["ATHOM DENTAL","Shuffle Lite","7.7","50","8"],["ATHOM DENTAL","Shuffle 4K","2.3","35","6"],["ATHOM DENTAL","Shuffle XL Lite","4.2","50","8"],["ATHOM DENTAL","Transform","2.5","35","6"],["ATHOM DENTAL","Sonic 4K","2.2","35","6"],["ATHOM DENTAL","Sonic XL 4K","2.2","35","6"],["ATHOM DENTAL","Sonic XL 4K Plus","2.2","35","6"],["SPARK","Photon Mono","1.6","30","5"],["SPARK","Photon P1","2","35","6"],["SPARK","Photon Ultra","2","35","6"],["SPARK","Photon D2","2","35","6"]],"D":["6aae2397db3219622d8c27d4","6aae2396db3219622d8c2782","6aae2397db3219622d8c27de","69eeef66b704e6d9ecbcf6c6","69eeef66b704e6d9ecbcf6c7","69eeef66b704e6d9ecbcf6c8","69eeef66b704e6d9ecbcf6c9","69eeef66b704e6d9ecbcf6ca","69eeef66b704e6d9ecbcf6cb","69eeef66b704e6d9ecbcf6cc","69eeef66b704e6d9ecbcf6cd","6aae248ddb3219622d8c297a","6aae248ddb3219622d8c2998","6aae24d5db3219622d8c2a0e","6aae24d5db3219622d8c29ea","6aae251cdb3219622d8c2a94","6aae251ddb3219622d8c2aa8","6aae251ddb3219622d8c2b3a","6aae251ddb3219622d8c2b3c","6aae2566db3219622d8c2bc0","6aae2566db3219622d8c2bc8","69eeef66b704e6d9ecbcf766","69eeef66b704e6d9ecbcf77e","69eeef66b704e6d9ecbcf768","69eeef66b704e6d9ecbcf780","69eeef66b704e6d9ecbcf769","69eeef66b704e6d9ecbcf781","69eeef66b704e6d9ecbcf76a","69eeef66b704e6d9ecbcf782","69eeef66b704e6d9ecbcf76b","69eeef66b704e6d9ecbcf783","69eeef66b704e6d9ecbcf76d","69eeef66b704e6d9ecbcf785","69eeef66b704e6d9ecbcf76e","69eeef66b704e6d9ecbcf786","69eeef66b704e6d9ecbcf7b9","69eeef66b704e6d9ecbcf7d1","69eeef66b704e6d9ecbcf7e9","69eeef66b704e6d9ecbcf81c","69eeef66b704e6d9ecbcf7ba","69eeef66b704e6d9ecbcf7d2","69eeef66b704e6d9ecbcf7ea","69eeef66b704e6d9ecbcf81d","69eeef66b704e6d9ecbcf7bb","69eeef66b704e6d9ecbcf7d3","69eeef66b704e6d9ecbcf7eb","69eeef66b704e6d9ecbcf81e","69eeef66b704e6d9ecbcf7bc","69eeef66b704e6d9ecbcf7d4","69eeef66b704e6d9ecbcf7ec","69eeef66b704e6d9ecbcf81f","69eeef66b704e6d9ecbcf7bd","69eeef66b704e6d9ecbcf7d5","69eeef66b704e6d9ecbcf7ed","69eeef66b704e6d9ecbcf820","69eeef66b704e6d9ecbcf7be","69eeef66b704e6d9ecbcf7d6","69eeef66b704e6d9ecbcf7ee","69eeef66b704e6d9ecbcf821","69eeef66b704e6d9ecbcf7bf","69eeef66b704e6d9ecbcf7d7","69eeef66b704e6d9ecbcf7ef","69eeef66b704e6d9ecbcf822","69eeef66b704e6d9ecbcf7c0","69eeef66b704e6d9ecbcf7d8","69eeef66b704e6d9ecbcf7f0","69eeef66b704e6d9ecbcf823","69eeef66b704e6d9ecbcf778","69eeef66b704e6d9ecbcf7c2","69eeef66b704e6d9ecbcf7da","69eeef66b704e6d9ecbcf7f2","69eeef66b704e6d9ecbcf825","69eeef66b704e6d9ecbcf779","69eeef66b704e6d9ecbcf7c3","69eeef66b704e6d9ecbcf7db","69eeef66b704e6d9ecbcf7f3","69eeef66b704e6d9ecbcf826","69eeef66b704e6d9ecbcf777","69eeef66b704e6d9ecbcf7c1","69eeef66b704e6d9ecbcf7d9","69eeef66b704e6d9ecbcf7f1","69eeef66b704e6d9ecbcf824","69eeef66b704e6d9ecbcf77b","69eeef66b704e6d9ecbcf7c5","69eeef66b704e6d9ecbcf7dd","69eeef66b704e6d9ecbcf7f5","69eeef66b704e6d9ecbcf828","6aae25f7db3219622d8c2c2a","69eeef66b704e6d9ecbcf77a","69eeef66b704e6d9ecbcf7c4","69eeef66b704e6d9ecbcf7dc","69eeef66b704e6d9ecbcf7f4","69eeef66b704e6d9ecbcf827","6aae25f7db3219622d8c2c28","69eeef66b704e6d9ecbcf6eb","69eeef66b704e6d9ecbcf703","69eeef66b704e6d9ecbcf71b","69eeef66b704e6d9ecbcf733","69eeef66b704e6d9ecbcf74c","69eeef66b704e6d9ecbcf764","69eeef66b704e6d9ecbcf77c","69eeef66b704e6d9ecbcf796","69eeef66b704e6d9ecbcf7ae","69eeef66b704e6d9ecbcf7c6","69eeef66b704e6d9ecbcf7de","69eeef66b704e6d9ecbcf7f6","69eeef66b704e6d9ecbcf811","69eeef66b704e6d9ecbcf829","6aae25f7db3219622d8c2c38","6aae25f7db3219622d8c2cce","6aae25f7db3219622d8c2ce2","6aae2642db3219622d8c2d06","6aae2642db3219622d8c2d08","6aae2642db3219622d8c2daa"],"R":[["69eeef66b704e6d9ecbcf7a1","ATHOM GENGIVA"],["69eeef66b704e6d9ecbcf7a2","ATHOM GENGIVA"],["69eeef66b704e6d9ecbcf7a3","ATHOM GENGIVA"],["69eeef66b704e6d9ecbcf7a4","ATHOM GENGIVA"],["69eeef66b704e6d9ecbcf7a5","ATHOM GENGIVA"],["69eeef66b704e6d9ecbcf7a6","ATHOM GENGIVA"],["69eeef66b704e6d9ecbcf7a7","ATHOM GENGIVA"],["69eeef66b704e6d9ecbcf7a8","ATHOM GENGIVA"],["69eeef66b704e6d9ecbcf7a9","ATHOM GENGIVA"],["69eeef66b704e6d9ecbcf7aa","ATHOM GENGIVA"],["69eeef66b704e6d9ecbcf7ab","ATHOM GENGIVA"],["69eeef66b704e6d9ecbcf7ac","ATHOM GENGIVA"],["69eeef66b704e6d9ecbcf7ad","ATHOM GENGIVA"],["69eeef66b704e6d9ecbcf7e0","ATHOM CASTABLE"],["69eeef66b704e6d9ecbcf7e2","ATHOM CASTABLE"],["69eeef66b704e6d9ecbcf7e3","ATHOM CASTABLE"],["69eeef66b704e6d9ecbcf7e4","ATHOM CASTABLE"],["69eeef66b704e6d9ecbcf7e5","ATHOM CASTABLE"],["69eeef66b704e6d9ecbcf7e7","ATHOM CASTABLE"],["69eeef66b704e6d9ecbcf7e8","ATHOM CASTABLE"]]};


const oid = (s) => new mongoose.Types.ObjectId(s);
const cab = (t) => console.log('\n' + '='.repeat(64) + '\n' + t + '\n' + '='.repeat(64));

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('ERRO: MONGODB_URI nao definida.'); process.exit(1); }
  await mongoose.connect(uri);
  const db  = mongoose.connection.db;
  const col = db.collection('parametros');

  // ---------------------------------------------------------------- DESFAZER
  if (DESFAZER) {
    cab('DESFAZER');
    const existe = await db.listCollections({ name: COL_BACKUP }).toArray();
    if (!existe.length) {
      console.error(`ERRO: a colecao ${COL_BACKUP} nao existe. Nada a desfazer.`);
      await mongoose.disconnect(); process.exit(1);
    }
    const docs = await db.collection(COL_BACKUP).find({}).toArray();
    console.log(`registros no backup interno: ${docs.length}`);
    if (docs.length !== TOTAL_ESPERADO) {
      console.error(`ABORTADO: esperava ${TOTAL_ESPERADO} registros no backup.`);
      await mongoose.disconnect(); process.exit(1);
    }
    await col.deleteMany({});
    await col.insertMany(docs, { ordered: false });
    console.log(`restaurados: ${await col.countDocuments()} registros`);
    console.log('Pronto. A colecao voltou ao estado de 05/10/2026.');
    await mongoose.disconnect(); return;
  }

  console.log(APLICAR ? '*** MODO APLICAR - VAI GRAVAR NO BANCO ***'
                      : '--- MODO SIMULACAO - nao grava nada ---');

  // ------------------------------------------------------ conferencias
  const total = await col.countDocuments();
  console.log(`\ndocumentos em parametros: ${total} (esperado ${TOTAL_ESPERADO})`);
  if (total !== TOTAL_ESPERADO) {
    console.error('ABORTADO: a colecao mudou desde que o plano foi calculado.');
    console.error('Chame o Claude para recalcular as operacoes.');
    await mongoose.disconnect(); process.exit(1);
  }

  const ids = [...OPS.U.map(u => u[0]), ...OPS.D, ...OPS.R.map(r => r[0])].map(oid);
  const achados = await col.countDocuments({ _id: { $in: ids } });
  console.log(`_id do plano encontrados: ${achados} de ${ids.length}`);
  if (achados !== ids.length) {
    console.error('ABORTADO: algum registro do plano nao existe mais.');
    await mongoose.disconnect(); process.exit(1);
  }

  // ------------------------------------------------------------ previa
  cab(`UPDATE - ${OPS.U.length} registros`);
  OPS.U.slice(0, 6).forEach(u => console.log(`  ${u[1]} / ${u[2]} -> exp ${u[3]} | base ${u[4]} | camadas ${u[5]}`));
  console.log(`  ... e mais ${OPS.U.length - 6}`);

  cab(`INSERT - ${OPS.I.length} registros novos`);
  OPS.I.forEach(i => console.log(`  ${i[0]} / ${i[1]} -> exp ${i[2]} | base ${i[3]} | camadas ${i[4]}`));

  cab(`DELETE - ${OPS.D.length} duplicados`);
  const amostra = await col.find({ _id: { $in: OPS.D.slice(0, 6).map(oid) } }).toArray();
  amostra.forEach(d => console.log(`  ${d.resina} / ${d.impressora} -> ${d.exposicaoNormal} | ${d.exposicaoBase} | ${d.camadasBase}`));
  console.log(`  ... e mais ${OPS.D.length - 6}`);

  cab(`RENAME resina - ${OPS.R.length} registros`);
  const cnt = {}; OPS.R.forEach(r => { cnt[r[1]] = (cnt[r[1]] || 0) + 1; });
  Object.entries(cnt).forEach(([k, v]) => console.log(`  -> ${k}: ${v} registros`));

  console.log(`\nRESULTADO: ${total} - ${OPS.D.length} + ${OPS.I.length} = ${total - OPS.D.length + OPS.I.length} registros`);

  if (!APLICAR) {
    console.log('\nNada foi gravado. Para aplicar:');
    console.log('   node scripts/migrar-parametros.js --aplicar\n');
    await mongoose.disconnect(); return;
  }

  // ------------------------------------------- copia de seguranca interna
  cab('COPIA DE SEGURANCA DENTRO DO BANCO');
  const jaTem = await db.listCollections({ name: COL_BACKUP }).toArray();
  if (jaTem.length) {
    const n = await db.collection(COL_BACKUP).countDocuments();
    console.log(`  ${COL_BACKUP} ja existe com ${n} registros - mantida como esta.`);
    if (n !== TOTAL_ESPERADO) {
      console.error('  ABORTADO: backup existente nao bate com 1275. Investigue antes.');
      await mongoose.disconnect(); process.exit(1);
    }
  } else {
    const todos = await col.find({}).toArray();
    await db.collection(COL_BACKUP).insertMany(todos, { ordered: false });
    console.log(`  ${COL_BACKUP} criada com ${await db.collection(COL_BACKUP).countDocuments()} registros.`);
  }

  // --------------------------------------------------------- gravacao
  cab('APLICANDO');
  const agora = new Date();
  const bulk = [];
  for (const [id, resina, impressora, en, eb, cb] of OPS.U) {
    bulk.push({ updateOne: { filter: { _id: oid(id) }, update: { $set: {
      resina, impressora, alturaCamada: '0.05mm', exposicaoNormal: en,
      exposicaoBase: eb, camadasBase: cb, updatedAt: agora } } } });
  }
  for (const [id, resina] of OPS.R)
    bulk.push({ updateOne: { filter: { _id: oid(id) }, update: { $set: { resina, updatedAt: agora } } } });
  for (const id of OPS.D)
    bulk.push({ deleteOne: { filter: { _id: oid(id) } } });
  for (const [resina, impressora, en, eb, cb] of OPS.I)
    bulk.push({ insertOne: { document: { resina, impressora, alturaCamada: '0.05mm',
      exposicaoNormal: en, exposicaoBase: eb, camadasBase: cb, confianca: 'alta',
      versao: null, metodoValidacao: null, createdAt: agora, updatedAt: agora, __v: 0 } } });

  const r = await col.bulkWrite(bulk, { ordered: false });
  console.log(`  modificados: ${r.modifiedCount}`);
  console.log(`  apagados   : ${r.deletedCount}`);
  console.log(`  inseridos  : ${r.insertedCount}`);

  // ------------------------------------------------------- conferencia
  cab('CONFERENCIA FINAL');
  console.log(`total: ${await col.countDocuments()} (esperado ${total - OPS.D.length + OPS.I.length})`);

  const conflitos = await col.aggregate([
    { $group: { _id: { r: '$resina', i: '$impressora' }, n: { $sum: 1 },
      combos: { $addToSet: { a: '$alturaCamada', en: '$exposicaoNormal',
                             eb: '$exposicaoBase', cb: '$camadasBase' } } } },
    { $match: { $expr: { $gt: [{ $size: '$combos' }, 1] } } },
    { $sort: { '_id.r': 1, '_id.i': 1 } }
  ]).toArray();
  console.log(`\ngrupos em conflito: ${conflitos.length} (esperado 5, todos parados de proposito)`);
  conflitos.forEach(c => console.log(`   ${c._id.r} / ${c._id.i} (${c.n})`));

  const zerados = await col.countDocuments({ exposicaoNormal: { $in: ['0s', '0', '0.0'] } });
  console.log(`\nregistros zerados: ${zerados}`);
  console.log(`resinas: ${(await col.distinct('resina')).length} (eram 18)`);
  console.log(`impressoras: ${(await col.distinct('impressora')).length} (eram 122)`);

  console.log(`\nSe algo estiver errado: node scripts/migrar-parametros.js --desfazer`);
  console.log('Mande esta saida inteira para o Claude conferir.\n');
  await mongoose.disconnect();
}

main().catch(async (e) => { console.error('\nFALHOU:', e); await mongoose.disconnect(); process.exit(1); });
