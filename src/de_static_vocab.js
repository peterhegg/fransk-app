// Swiss-German starter vocabulary (de-CH) — first three bolker.
//
// Written form is Swiss Standard German (Schweizer Hochdeutsch): NEVER ß,
// always "ss" (Strasse, Fussball, gross). Helvetisms are preferred where
// they're the everyday Swiss word (Velo, Natel, Billett, Glace, Poulet,
// Rüebli, Gipfeli, Zmorge/Zmittag/Znacht, Spital, parkieren, Grüezi, Merci).
//
// Field shape mirrors the French static_vocab.js so every screen works
// unchanged: the `fr` key holds the TARGET-language word (here German),
// `no` the Norwegian gloss, `p` the Norwegian phonetic approximation,
// `forms` an array of [form, code, gloss] triples.
//   codes: pr=Präsens, pc=Perfekt, imp=Präteritum, f=Futur,
//          impv=Imperativ, pp=Partizip, n=substantiv, np=substantiv flertall
//
// Phonetics use Norwegian spelling: ü→y, ö→ø, ä→æ, ei→ai, eu/äu→oi,
// ie→i, z→ts, v/f→f, w→v, sch→sj, sp-/st-→sjp/sjt, ch→kh/kj, -er→ər.

export const DE_STATIC_VOCAB = {
  // ── kern — kjerneord: hilsener, pronomen, kjerneverb, basissubstantiv ──
  kern: [
    // Hilsener og høflighet (sveitsiske)
    { fr:"Grüezi", no:"hei / god dag (sveitsisk)", p:"gryetsi", forms:[] },
    { fr:"Merci", no:"takk", p:"mærsi", forms:[] },
    { fr:"Merci vilmal", no:"tusen takk (sveitsisk)", p:"mærsi filmal", forms:[] },
    { fr:"Adieu", no:"ha det (sveitsisk)", p:"adjø", forms:[] },
    { fr:"bitte", no:"vær så snill / vær så god", p:"bitə", forms:[] },
    { fr:"ja", no:"ja", p:"ja", forms:[] },
    { fr:"nein", no:"nei", p:"nain", forms:[] },
    { fr:"Entschuldigung", no:"unnskyld", p:"æntsjuldigung", forms:[] },
    // Kjerneverb
    { fr:"sein", no:"å være", p:"sain", forms:[["ich bin","pr","jeg er"],["wir sind","pr","vi er"],["sie sind","pr","de er"],["ich bin gewesen","pc","jeg har vært"],["ich war","imp","jeg var"],["ich werde sein","f","jeg vil være"],["sei!","impv","vær!"],["gewesen","pp","vært"]] },
    { fr:"haben", no:"å ha", p:"habən", forms:[["ich habe","pr","jeg har"],["wir haben","pr","vi har"],["sie haben","pr","de har"],["ich habe gehabt","pc","jeg har hatt"],["ich hatte","imp","jeg hadde"],["ich werde haben","f","jeg vil ha"],["hab!","impv","ha!"],["gehabt","pp","hatt"]] },
    { fr:"werden", no:"å bli", p:"verdən", forms:[["ich werde","pr","jeg blir"],["wir werden","pr","vi blir"],["sie werden","pr","de blir"],["ich bin geworden","pc","jeg har blitt"],["ich wurde","imp","jeg ble"],["werde!","impv","bli!"],["geworden","pp","blitt"]] },
    { fr:"gehen", no:"å gå", p:"geən", forms:[["ich gehe","pr","jeg går"],["wir gehen","pr","vi går"],["sie gehen","pr","de går"],["ich bin gegangen","pc","jeg har gått"],["ich ging","imp","jeg gikk"],["geh!","impv","gå!"],["gegangen","pp","gått"]] },
    { fr:"kommen", no:"å komme", p:"kåmən", forms:[["ich komme","pr","jeg kommer"],["wir kommen","pr","vi kommer"],["sie kommen","pr","de kommer"],["ich bin gekommen","pc","jeg har kommet"],["ich kam","imp","jeg kom"],["komm!","impv","kom!"],["gekommen","pp","kommet"]] },
    { fr:"machen", no:"å gjøre / å lage", p:"makhən", forms:[["ich mache","pr","jeg gjør"],["wir machen","pr","vi gjør"],["sie machen","pr","de gjør"],["ich habe gemacht","pc","jeg har gjort"],["ich machte","imp","jeg gjorde"],["mach!","impv","gjør!"],["gemacht","pp","gjort"]] },
    { fr:"sagen", no:"å si", p:"sagən", forms:[["ich sage","pr","jeg sier"],["wir sagen","pr","vi sier"],["sie sagen","pr","de sier"],["ich habe gesagt","pc","jeg har sagt"],["ich sagte","imp","jeg sa"],["sag!","impv","si!"],["gesagt","pp","sagt"]] },
    { fr:"sehen", no:"å se", p:"seən", forms:[["ich sehe","pr","jeg ser"],["wir sehen","pr","vi ser"],["sie sehen","pr","de ser"],["ich habe gesehen","pc","jeg har sett"],["ich sah","imp","jeg så"],["sieh!","impv","se!"],["gesehen","pp","sett"]] },
    { fr:"geben", no:"å gi", p:"gebən", forms:[["ich gebe","pr","jeg gir"],["wir geben","pr","vi gir"],["sie geben","pr","de gir"],["ich habe gegeben","pc","jeg har gitt"],["ich gab","imp","jeg ga"],["gib!","impv","gi!"],["gegeben","pp","gitt"]] },
    { fr:"nehmen", no:"å ta", p:"nemən", forms:[["ich nehme","pr","jeg tar"],["wir nehmen","pr","vi tar"],["sie nehmen","pr","de tar"],["ich habe genommen","pc","jeg har tatt"],["ich nahm","imp","jeg tok"],["nimm!","impv","ta!"],["genommen","pp","tatt"]] },
    { fr:"finden", no:"å finne", p:"findən", forms:[["ich finde","pr","jeg finner"],["wir finden","pr","vi finner"],["sie finden","pr","de finner"],["ich habe gefunden","pc","jeg har funnet"],["ich fand","imp","jeg fant"],["find!","impv","finn!"],["gefunden","pp","funnet"]] },
    { fr:"denken", no:"å tenke", p:"dænkən", forms:[["ich denke","pr","jeg tenker"],["wir denken","pr","vi tenker"],["sie denken","pr","de tenker"],["ich habe gedacht","pc","jeg har tenkt"],["ich dachte","imp","jeg tenkte"],["denk!","impv","tenk!"],["gedacht","pp","tenkt"]] },
    { fr:"wissen", no:"å vite", p:"visən", forms:[["ich weiss","pr","jeg vet"],["wir wissen","pr","vi vet"],["sie wissen","pr","de vet"],["ich habe gewusst","pc","jeg har visst"],["ich wusste","imp","jeg visste"],["gewusst","pp","visst"]] },
    { fr:"sprechen", no:"å snakke", p:"sjprækjən", forms:[["ich spreche","pr","jeg snakker"],["wir sprechen","pr","vi snakker"],["sie sprechen","pr","de snakker"],["ich habe gesprochen","pc","jeg har snakket"],["ich sprach","imp","jeg snakket"],["sprich!","impv","snakk!"],["gesprochen","pp","snakket"]] },
    { fr:"essen", no:"å spise", p:"æsən", forms:[["ich esse","pr","jeg spiser"],["wir essen","pr","vi spiser"],["sie essen","pr","de spiser"],["ich habe gegessen","pc","jeg har spist"],["ich ass","imp","jeg spiste"],["iss!","impv","spis!"],["gegessen","pp","spist"]] },
    { fr:"trinken", no:"å drikke", p:"trinkən", forms:[["ich trinke","pr","jeg drikker"],["wir trinken","pr","vi drikker"],["sie trinken","pr","de drikker"],["ich habe getrunken","pc","jeg har drukket"],["ich trank","imp","jeg drakk"],["trink!","impv","drikk!"],["getrunken","pp","drukket"]] },
    { fr:"wollen", no:"å ville", p:"vålən", forms:[["ich will","pr","jeg vil"],["wir wollen","pr","vi vil"],["sie wollen","pr","de vil"],["ich habe gewollt","pc","jeg har villet"],["ich wollte","imp","jeg ville"],["gewollt","pp","villet"]] },
    { fr:"können", no:"å kunne", p:"kønən", forms:[["ich kann","pr","jeg kan"],["wir können","pr","vi kan"],["sie können","pr","de kan"],["ich habe gekonnt","pc","jeg har kunnet"],["ich konnte","imp","jeg kunne"],["gekonnt","pp","kunnet"]] },
    { fr:"müssen", no:"å måtte", p:"mysən", forms:[["ich muss","pr","jeg må"],["wir müssen","pr","vi må"],["sie müssen","pr","de må"],["ich habe gemusst","pc","jeg har måttet"],["ich musste","imp","jeg måtte"],["gemusst","pp","måttet"]] },
    // Basissubstantiv
    { fr:"Mann", no:"mannen", p:"man", forms:[["der Mann","n","mannen"],["die Männer","np","mennene"]] },
    { fr:"Frau", no:"kvinnen", p:"frau", forms:[["die Frau","n","kvinnen"],["die Frauen","np","kvinnene"]] },
    { fr:"Kind", no:"barnet", p:"kind", forms:[["das Kind","n","barnet"],["die Kinder","np","barna"]] },
    { fr:"Haus", no:"huset", p:"haus", forms:[["das Haus","n","huset"],["die Häuser","np","husene"]] },
    { fr:"Tag", no:"dagen", p:"tak", forms:[["der Tag","n","dagen"],["die Tage","np","dagene"]] },
    { fr:"Jahr", no:"året", p:"jar", forms:[["das Jahr","n","året"],["die Jahre","np","årene"]] },
    { fr:"Zeit", no:"tiden", p:"tsait", forms:[["die Zeit","n","tiden"],["die Zeiten","np","tidene"]] },
    { fr:"Wasser", no:"vannet", p:"vasər", forms:[["das Wasser","n","vannet"]] },
    { fr:"Stadt", no:"byen", p:"sjtat", forms:[["die Stadt","n","byen"],["die Städte","np","byene"]] },
    { fr:"Land", no:"landet", p:"land", forms:[["das Land","n","landet"],["die Länder","np","landene"]] },
    { fr:"Mensch", no:"mennesket", p:"mænsj", forms:[["der Mensch","n","mennesket"],["die Menschen","np","menneskene"]] },
    { fr:"Buch", no:"boken", p:"bukh", forms:[["das Buch","n","boken"],["die Bücher","np","bøkene"]] },
    // Adjektiver og vanlige ord
    { fr:"gut", no:"god / bra", p:"gut", forms:[] },
    { fr:"gross", no:"stor", p:"gross", forms:[] },
    { fr:"klein", no:"liten", p:"klain", forms:[] },
    { fr:"neu", no:"ny", p:"noi", forms:[] },
    { fr:"alt", no:"gammel", p:"alt", forms:[] },
    { fr:"schön", no:"vakker / fin", p:"sjøn", forms:[] },
    { fr:"und", no:"og", p:"unt", forms:[] },
    { fr:"aber", no:"men", p:"abər", forms:[] },
    { fr:"nicht", no:"ikke", p:"nikt", forms:[] },
    { fr:"sehr", no:"veldig", p:"ser", forms:[] },
    { fr:"heute", no:"i dag", p:"hoitə", forms:[] },
    { fr:"jetzt", no:"nå", p:"jætst", forms:[] },
  ],

  // ── alltag — hverdagssituasjoner: mat, butikk, transport, rutine ──────
  alltag: [
    // Mat og drikke (sveitsiske)
    { fr:"Kaffee", no:"kaffen", p:"kafe", forms:[["der Kaffee","n","kaffen"]] },
    { fr:"Gipfeli", no:"croissanten (sveitsisk)", p:"gipfəli", forms:[["das Gipfeli","n","croissanten"],["die Gipfeli","np","croissantene"]] },
    { fr:"Brot", no:"brødet", p:"brot", forms:[["das Brot","n","brødet"],["die Brote","np","brødene"]] },
    { fr:"Käse", no:"osten", p:"kæzə", forms:[["der Käse","n","osten"]] },
    { fr:"Schoggi", no:"sjokoladen (sveitsisk)", p:"sjågi", forms:[["die Schoggi","n","sjokoladen"]] },
    { fr:"Glace", no:"iskremen (sveitsisk)", p:"glas", forms:[["die Glace","n","iskremen"]] },
    { fr:"Poulet", no:"kyllingen (sveitsisk)", p:"pule", forms:[["das Poulet","n","kyllingen"]] },
    { fr:"Rüebli", no:"gulroten (sveitsisk)", p:"ryəbli", forms:[["das Rüebli","n","gulroten"],["die Rüebli","np","gulrøttene"]] },
    { fr:"Wein", no:"vinen", p:"vain", forms:[["der Wein","n","vinen"],["die Weine","np","vinene"]] },
    { fr:"Bier", no:"ølet", p:"bir", forms:[["das Bier","n","ølet"],["die Biere","np","ølene"]] },
    { fr:"Milch", no:"melken", p:"milkj", forms:[["die Milch","n","melken"]] },
    { fr:"Apfel", no:"eplet", p:"apfəl", forms:[["der Apfel","n","eplet"],["die Äpfel","np","eplene"]] },
    { fr:"Most", no:"eplemosten (sveitsisk)", p:"måst", forms:[["der Most","n","eplemosten"]] },
    // Butikk og tjenester
    { fr:"Laden", no:"butikken", p:"ladən", forms:[["der Laden","n","butikken"],["die Läden","np","butikkene"]] },
    { fr:"Markt", no:"markedet", p:"markt", forms:[["der Markt","n","markedet"],["die Märkte","np","markedene"]] },
    { fr:"Geld", no:"pengene", p:"gælt", forms:[["das Geld","n","pengene"]] },
    { fr:"Preis", no:"prisen", p:"prais", forms:[["der Preis","n","prisen"],["die Preise","np","prisene"]] },
    { fr:"Quittung", no:"kvitteringen", p:"kvitung", forms:[["die Quittung","n","kvitteringen"],["die Quittungen","np","kvitteringene"]] },
    { fr:"Spital", no:"sykehuset (sveitsisk)", p:"sjpital", forms:[["das Spital","n","sykehuset"],["die Spitäler","np","sykehusene"]] },
    { fr:"Apotheke", no:"apoteket", p:"apotekə", forms:[["die Apotheke","n","apoteket"],["die Apotheken","np","apotekene"]] },
    // Transport (sveitsiske)
    { fr:"Velo", no:"sykkelen (sveitsisk)", p:"velo", forms:[["das Velo","n","sykkelen"],["die Velos","np","syklene"]] },
    { fr:"Natel", no:"mobilen (sveitsisk)", p:"natəl", forms:[["das Natel","n","mobilen"],["die Natels","np","mobilene"]] },
    { fr:"Billett", no:"billetten (sveitsisk)", p:"biljæt", forms:[["das Billett","n","billetten"],["die Billette","np","billettene"]] },
    { fr:"Perron", no:"perrongen (sveitsisk)", p:"pærong", forms:[["der Perron","n","perrongen"],["die Perrons","np","perrongene"]] },
    { fr:"Tram", no:"trikken (sveitsisk)", p:"tram", forms:[["das Tram","n","trikken"],["die Trams","np","trikkene"]] },
    { fr:"Bahnhof", no:"togstasjonen", p:"banhof", forms:[["der Bahnhof","n","togstasjonen"],["die Bahnhöfe","np","togstasjonene"]] },
    { fr:"Zug", no:"toget", p:"tsuk", forms:[["der Zug","n","toget"],["die Züge","np","togene"]] },
    { fr:"Trottoir", no:"fortauet (sveitsisk)", p:"tråtoar", forms:[["das Trottoir","n","fortauet"],["die Trottoirs","np","fortauene"]] },
    { fr:"Strasse", no:"gaten", p:"sjtrasə", forms:[["die Strasse","n","gaten"],["die Strassen","np","gatene"]] },
    // Hverdagsrutine (sveitsiske måltider)
    { fr:"Zmorge", no:"frokosten (sveitsisk)", p:"tsmårgə", forms:[["das Zmorge","n","frokosten"]] },
    { fr:"Zmittag", no:"lunsjen (sveitsisk)", p:"tsmitak", forms:[["das Zmittag","n","lunsjen"]] },
    { fr:"Znacht", no:"middagen (sveitsisk)", p:"tsnakt", forms:[["das Znacht","n","middagen"]] },
    // Hverdagsverb
    { fr:"kaufen", no:"å kjøpe", p:"kaufən", forms:[["ich kaufe","pr","jeg kjøper"],["wir kaufen","pr","vi kjøper"],["sie kaufen","pr","de kjøper"],["ich habe gekauft","pc","jeg har kjøpt"],["ich kaufte","imp","jeg kjøpte"],["kauf!","impv","kjøp!"],["gekauft","pp","kjøpt"]] },
    { fr:"bezahlen", no:"å betale", p:"bətsalən", forms:[["ich bezahle","pr","jeg betaler"],["wir bezahlen","pr","vi betaler"],["sie bezahlen","pr","de betaler"],["ich habe bezahlt","pc","jeg har betalt"],["ich bezahlte","imp","jeg betalte"],["bezahl!","impv","betal!"],["bezahlt","pp","betalt"]] },
    { fr:"bestellen", no:"å bestille", p:"bəsjtælən", forms:[["ich bestelle","pr","jeg bestiller"],["wir bestellen","pr","vi bestiller"],["sie bestellen","pr","de bestiller"],["ich habe bestellt","pc","jeg har bestilt"],["ich bestellte","imp","jeg bestilte"],["bestell!","impv","bestill!"],["bestellt","pp","bestilt"]] },
    { fr:"arbeiten", no:"å jobbe", p:"arbaitən", forms:[["ich arbeite","pr","jeg jobber"],["wir arbeiten","pr","vi jobber"],["sie arbeiten","pr","de jobber"],["ich habe gearbeitet","pc","jeg har jobbet"],["ich arbeitete","imp","jeg jobbet"],["arbeite!","impv","jobb!"],["gearbeitet","pp","jobbet"]] },
    { fr:"parkieren", no:"å parkere (sveitsisk)", p:"parkirən", forms:[["ich parkiere","pr","jeg parkerer"],["wir parkieren","pr","vi parkerer"],["sie parkieren","pr","de parkerer"],["ich habe parkiert","pc","jeg har parkert"],["ich parkierte","imp","jeg parkerte"],["parkier!","impv","parker!"],["parkiert","pp","parkert"]] },
    { fr:"wohnen", no:"å bo", p:"voːnən", forms:[["ich wohne","pr","jeg bor"],["wir wohnen","pr","vi bor"],["sie wohnen","pr","de bor"],["ich habe gewohnt","pc","jeg har bodd"],["ich wohnte","imp","jeg bodde"],["wohn!","impv","bo!"],["gewohnt","pp","bodd"]] },
  ],

  // ── sport — generell idrett, sveitsisk kontekst (ikke Bundesliga) ─────
  sport: [
    // Idretter (sveitsiske favoritter)
    { fr:"Fussball", no:"fotball", p:"fusbal", forms:[["der Fussball","n","fotballen"]] },
    { fr:"Eishockey", no:"ishockey", p:"aishåki", forms:[["das Eishockey","n","ishockeyen"]] },
    { fr:"Ski", no:"ski", p:"sji", forms:[["der Ski","n","skien"],["die Ski","np","skiene"]] },
    { fr:"Schwingen", no:"sveitsisk bryting", p:"sjvingən", forms:[["das Schwingen","n","brytingen"]] },
    { fr:"Tennis", no:"tennis", p:"tænis", forms:[["das Tennis","n","tennisen"]] },
    { fr:"Wandern", no:"fjellvandring / tur", p:"vandərn", forms:[["das Wandern","n","vandringen"]] },
    // Substantiv
    { fr:"Ball", no:"ballen", p:"bal", forms:[["der Ball","n","ballen"],["die Bälle","np","ballene"]] },
    { fr:"Tor", no:"målet", p:"tor", forms:[["das Tor","n","målet"],["die Tore","np","målene"]] },
    { fr:"Spiel", no:"kampen / spillet", p:"sjpil", forms:[["das Spiel","n","kampen"],["die Spiele","np","kampene"]] },
    { fr:"Mannschaft", no:"laget", p:"mansjaft", forms:[["die Mannschaft","n","laget"],["die Mannschaften","np","lagene"]] },
    { fr:"Verein", no:"klubben", p:"færain", forms:[["der Verein","n","klubben"],["die Vereine","np","klubbene"]] },
    { fr:"Spieler", no:"spilleren", p:"sjpilər", forms:[["der Spieler","n","spilleren"],["die Spieler","np","spillerne"]] },
    { fr:"Sieg", no:"seieren", p:"sik", forms:[["der Sieg","n","seieren"],["die Siege","np","seierne"]] },
    { fr:"Trainer", no:"treneren", p:"trænər", forms:[["der Trainer","n","treneren"],["die Trainer","np","trenerne"]] },
    { fr:"Meisterschaft", no:"mesterskapet", p:"maistərsjaft", forms:[["die Meisterschaft","n","mesterskapet"],["die Meisterschaften","np","mesterskapene"]] },
    { fr:"Stadion", no:"stadion", p:"sjtadiån", forms:[["das Stadion","n","stadion"],["die Stadien","np","stadionene"]] },
    { fr:"Berg", no:"fjellet", p:"bærk", forms:[["der Berg","n","fjellet"],["die Berge","np","fjellene"]] },
    { fr:"Schnee", no:"snøen", p:"sjne", forms:[["der Schnee","n","snøen"]] },
    { fr:"See", no:"innsjøen", p:"se", forms:[["der See","n","innsjøen"],["die Seen","np","innsjøene"]] },
    // Idrettsverb
    { fr:"spielen", no:"å spille", p:"sjpilən", forms:[["ich spiele","pr","jeg spiller"],["wir spielen","pr","vi spiller"],["sie spielen","pr","de spiller"],["ich habe gespielt","pc","jeg har spilt"],["ich spielte","imp","jeg spilte"],["spiel!","impv","spill!"],["gespielt","pp","spilt"]] },
    { fr:"gewinnen", no:"å vinne", p:"gəvinən", forms:[["ich gewinne","pr","jeg vinner"],["wir gewinnen","pr","vi vinner"],["sie gewinnen","pr","de vinner"],["ich habe gewonnen","pc","jeg har vunnet"],["ich gewann","imp","jeg vant"],["gewinn!","impv","vinn!"],["gewonnen","pp","vunnet"]] },
    { fr:"verlieren", no:"å tape", p:"færlirən", forms:[["ich verliere","pr","jeg taper"],["wir verlieren","pr","vi taper"],["sie verlieren","pr","de taper"],["ich habe verloren","pc","jeg har tapt"],["ich verlor","imp","jeg tapte"],["verlier!","impv","tap!"],["verloren","pp","tapt"]] },
    { fr:"laufen", no:"å løpe / å gå", p:"laufən", forms:[["ich laufe","pr","jeg løper"],["wir laufen","pr","vi løper"],["sie laufen","pr","de løper"],["ich bin gelaufen","pc","jeg har løpt"],["ich lief","imp","jeg løp"],["lauf!","impv","løp!"],["gelaufen","pp","løpt"]] },
    { fr:"rennen", no:"å springe", p:"rænən", forms:[["ich renne","pr","jeg springer"],["wir rennen","pr","vi springer"],["sie rennen","pr","de springer"],["ich bin gerannt","pc","jeg har sprunget"],["ich rannte","imp","jeg sprang"],["renn!","impv","spring!"],["gerannt","pp","sprunget"]] },
    { fr:"schwimmen", no:"å svømme", p:"sjvimən", forms:[["ich schwimme","pr","jeg svømmer"],["wir schwimmen","pr","vi svømmer"],["sie schwimmen","pr","de svømmer"],["ich bin geschwommen","pc","jeg har svømt"],["ich schwamm","imp","jeg svømte"],["schwimm!","impv","svøm!"],["geschwommen","pp","svømt"]] },
    { fr:"springen", no:"å hoppe", p:"sjpringən", forms:[["ich springe","pr","jeg hopper"],["wir springen","pr","vi hopper"],["sie springen","pr","de hopper"],["ich bin gesprungen","pc","jeg har hoppet"],["ich sprang","imp","jeg hoppet"],["spring!","impv","hopp!"],["gesprungen","pp","hoppet"]] },
    { fr:"werfen", no:"å kaste", p:"værfən", forms:[["ich werfe","pr","jeg kaster"],["wir werfen","pr","vi kaster"],["sie werfen","pr","de kaster"],["ich habe geworfen","pc","jeg har kastet"],["ich warf","imp","jeg kastet"],["wirf!","impv","kast!"],["geworfen","pp","kastet"]] },
    { fr:"trainieren", no:"å trene", p:"trænirən", forms:[["ich trainiere","pr","jeg trener"],["wir trainieren","pr","vi trener"],["sie trainieren","pr","de trener"],["ich habe trainiert","pc","jeg har trent"],["ich trainierte","imp","jeg trente"],["trainier!","impv","tren!"],["trainiert","pp","trent"]] },
    { fr:"wandern", no:"å vandre / å gå tur", p:"vandərn", forms:[["ich wandere","pr","jeg vandrer"],["wir wandern","pr","vi vandrer"],["sie wandern","pr","de vandrer"],["ich bin gewandert","pc","jeg har vandret"],["ich wanderte","imp","jeg vandret"],["wander!","impv","vandre!"],["gewandert","pp","vandret"]] },
  ],
};
