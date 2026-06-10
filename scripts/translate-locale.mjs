import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "../src/i18n/locales");

function transform(sourceName, targetName, replacements) {
  let content = fs.readFileSync(path.join(localesDir, sourceName), "utf8");
  content = content.replace(`const ${sourceName.replace(".ts", "")} =`, `const ${targetName.replace(".ts", "")} =`);
  content = content.replace(`export default ${sourceName.replace(".ts", "")}`, `export default ${targetName.replace(".ts", "")}`);
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(path.join(localesDir, targetName), content, "utf8");
}

const frFromDe = [
  ["Digitales Labor", "Laboratoire numérique"],
  ["Sprache", "Langue"],
  ["Ton an", "Son activé"],
  ["Ton aus", "Son désactivé"],
  ["Ton einschalten", "Activer le son"],
  ["Ton ausschalten", "Désactiver le son"],
  ["Betriebsregister schließen", "Fermer le registre opérationnel"],
  ["G.HUB-MASCHINE WIEDER AKTIVIEREN", "RÉACTIVER LA MACHINE G.HUB"],
  ["Alle physischen Kammern", "Toutes les chambres physiques ont été repliées"],
  ["Willkommen bei G.Hub", "Bienvenue sur G.Hub"],
  ["Ein lebendiges Erfindungsstudio", "Un studio d'invention vivant"],
  ["Mechanische Navigationsanleitung", "Guide de navigation mécanique"],
  ["Jog-Dial", "Jog dial"],
  ["Mausrad", "Molette de souris"],
  ["Tastatur", "Clavier"],
  ["Wo Ideen Wirklichkeit werden", "Là où les idées deviennent réalité"],
  ["Das Zusammenfügen von Gedanken visualisieren", "Visualiser l'assemblage des pensées"],
  ["Welten schaffen, die es zu erkunden lohnt", "Créer des mondes qui valent la peine d'être explorés"],
  ["Kommunikation jenseits der Sprache", "Communication au-delà de la langue"],
  ["Informationsgesteuerte Prozessmechanik", "Mécanique de processus pilotée par l'information"],
  ["Das nächste Experiment beginnt hier", "La prochaine expérience commence ici"],
  ["Koordinatenparameter eingeben", "Entrez vos paramètres de coordonnées"],
  ["JOG-DIAL BEDIENEN", "UTILISER LE JOG DIAL"],
  ["DAS LEBENDIGE DIGITALE ERFINDUNGSSTUDIO", "LE STUDIO D'INVENTION NUMÉRIQUE VIVANT"],
  ["Kontakt aufnehmen", "Initier le contact"],
  ["WISSENSCHAFTLICHE ANFRAGEN SENDEN", "TRANSMETTRE DES DEMANDES SCIENTIFIQUES"],
];

const itFromDe = [
  ["Digitales Labor", "Laboratorio digitale"],
  ["Sprache", "Lingua"],
  ["Ton an", "Audio attivo"],
  ["Ton aus", "Audio disattivo"],
  ["Ton einschalten", "Attiva audio"],
  ["Ton ausschalten", "Disattiva audio"],
  ["Betriebsregister schließen", "Chiudi registro operativo"],
  ["G.HUB-MASCHINE WIEDER AKTIVIEREN", "RIATTIVA MACCHINA G.HUB"],
  ["Willkommen bei G.Hub", "Benvenuto in G.Hub"],
  ["Ein lebendiges Erfindungsstudio", "Uno studio di invenzione vivente"],
  ["Mechanische Navigationsanleitung", "Guida alla navigazione meccanica"],
  ["Wo Ideen Wirklichkeit werden", "Dove le idee diventano realtà"],
  ["Kommunikation jenseits der Sprache", "Comunicazione oltre la lingua"],
  ["Kontakt aufnehmen", "Avvia contatto"],
  ["JOG-DIAL BEDIENEN", "USA IL JOG DIAL"],
];

const zhFromDe = [
  ["Digitales Labor", "数字实验室"],
  ["Sprache", "语言"],
  ["Ton an", "音效开"],
  ["Ton aus", "音效关"],
  ["Ton einschalten", "开启音效"],
  ["Ton ausschalten", "关闭音效"],
  ["Betriebsregister schließen", "关闭操作注册表"],
  ["G.HUB-MASCHINE WIEDER AKTIVIEREN", "重新展开 G.HUB 机器"],
  ["Willkommen bei G.Hub", "欢迎来到 G.Hub"],
  ["Ein lebendiges Erfindungsstudio", "鲜活的发明工作室"],
  ["Mechanische Navigationsanleitung", "机械导航指南"],
  ["Wo Ideen Wirklichkeit werden", "创意成真的地方"],
  ["Kommunikation jenseits der Sprache", "超越语言的沟通"],
  ["Kontakt aufnehmen", "发起联系"],
  ["JOG-DIAL BEDIENEN", "操作 jog 拨盘"],
  ["WISSENSCHAFTLICHE ANFRAGEN SENDEN", "发送科学咨询"],
];

const koFromDe = [
  ["Digitales Labor", "디지털 랩"],
  ["Sprache", "언어"],
  ["Ton an", "효과음 ON"],
  ["Ton aus", "효과음 OFF"],
  ["Ton einschalten", "효과음 켜기"],
  ["Ton ausschalten", "효과음 끄기"],
  ["Betriebsregister schließen", "운영 레지스트리 닫기"],
  ["G.HUB-MASCHINE WIEDER AKTIVIEREN", "G.HUB 머신 재가동"],
  ["Willkommen bei G.Hub", "G.Hub에 오신 것을 환영합니다"],
  ["Ein lebendiges Erfindungsstudio", "살아 있는 발명 스튜디오"],
  ["Mechanische Navigationsanleitung", "기계식 내비게이션 가이드"],
  ["Wo Ideen Wirklichkeit werden", "아이디어가 현실이 되는 곳"],
  ["Kommunikation jenseits der Sprache", "언어를 넘어선 소통"],
  ["Kontakt aufnehmen", "연락 시작"],
  ["JOG-DIAL BEDIENEN", "조그 다이얼 조작"],
  ["WISSENSCHAFTLICHE ANFRAGEN SENDEN", "과학 문의 전송"],
];

transform("de.ts", "fr.ts", frFromDe);
transform("de.ts", "it.ts", itFromDe);
transform("de.ts", "zh.ts", zhFromDe);
transform("de.ts", "ko.ts", koFromDe);

console.log("Generated fr.ts, it.ts, zh.ts, ko.ts from de.ts");
