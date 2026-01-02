/**
 * Vorchdorf-APP - Hauptlogik
 * Version: 2.50
 */

const APP_VERSION = '2.50';

// App Status
let currentView = 'home';
let navigationHistory = [];
let currentCategory = null;
let currentSubcategory = null;

// --- DATEN: UNTERNEHMEN (Auszug/Basis) ---
const allBusinesses = [
    { name: 'A-TEAM die Fahrschule', location: '4650 Lambach', link: 'https://www.ateam-fahrschule.at', category: 'services' },
    { name: 'A1 Apotheke, Mag. Valik', location: '4655 Vorchdorf', link: 'https://www.a1apotheke.at', category: 'healthcare' },
    { name: 'ABIES Austria GmbH', location: '4664 Laakirchen', link: 'https://www.abies-austria.at', category: 'industry' },
    { name: 'AHTEL Hochleithner Telekommunikation', location: '4654 Bad Wimsbach', link: 'https://www.ahtel.at', category: 'it' },
    { name: 'AIGNER - Mietwagen, Bus, Taxi, Transporte aller Art', location: '4655 Vorchdorf', link: 'https://www.mietwagen-aigner.at', category: 'transport' },
    { name: 'AIGNER Johannes - Raumausstatter, Tapeziermeister', location: '4655 Vorchdorf', link: 'https://www.aigner-raum.at', category: 'construction' },
    { name: 'AITZETMÜLLER Markus, Massagepraktik', location: '4655 Vorchdorf', category: 'healthcare' },
    { name: 'Alfred SCHNELLNBERGER GesmbH', location: '4655 Vorchdorf', link: 'https://www.schnellnberger.at', category: 'construction' },
    { name: 'ALMTAL CAMP', location: '4643 Pettenbach', link: 'https://www.almtal-camp.at', category: 'gastro' },
    { name: 'ALMTAL-Apotheke, Mag. Falkensammer', location: '4655 Vorchdorf', link: 'https://www.almtalapotheke.at', category: 'healthcare' },
    { name: 'AMERING Franz GesmbH, tipp topp Installationen', location: '4655 Vorchdorf', link: 'https://www.amering.at', category: 'construction' },
    { name: 'ANYTIME FITNESS Vorchdorf', location: '4655 Vorchdorf', link: 'https://www.af-austria.at', category: 'beauty' },
    { name: 'ARTINA GmbH', location: '4663 Laakirchen', link: 'https://www.artina.at', category: 'industry' },
    { name: 'ASAMER Kies- und Betonwerke', location: '4694 Ohlsdorf', link: 'https://www.asamer.at', category: 'construction' },
    { name: 'ATTWENGER-Taxi', location: '4655 Vorchdorf', link: 'https://www.taxi-attwenger.at', category: 'transport' },
    { name: 'Autohaus SCHWEIGER', location: '4643 Pettenbach', link: 'https://www.kfz-schweiger.at', category: 'cars' },
    { name: 'Automobile MAIRHUBER GmbH', location: '4664 Oberweis', link: 'https://www.autohausmairhuber.at', category: 'cars' },
    { name: 'Automobile SCHUSTER GmbH', location: '4663 Laakirchen', link: 'https://www.auto-schuster.at', category: 'cars' },
    { name: 'Automobile SWOBODA GmbH', location: '4664 Oberweis', link: 'https://www.automobileswoboda.at', category: 'cars' },
    { name: 'BAM.wohnen GmbH', location: '4655 Vorchdorf', link: 'https://www.bam-wohnen.at', category: 'construction' },
    { name: 'BARBERSHOP Erkan Abi', location: '4655 Vorchdorf', link: 'https://www.erkanabibarbersh op.at', category: 'beauty' },
    { name: 'Bauelemente ZIEGELB?CK KG', location: '4664 Oberweis', link: 'https://www.ziegelbaeck.at', category: 'construction' },
    { name: 'BAUMGARTNER Tischlerei & Raumplanung', location: '4655 Vorchdorf', link: 'https://www.tischlerelbaumgartner.com', category: 'construction' },
    { name: 'BAUMWERK GmbH', location: '4655 Vorchdorf', link: 'https://www.baumwerk.at', category: 'services' },
    { name: 'BEISKAMMER PV und Solar Montagen GmbH', location: '4655 Vorchdorf', link: 'https://www.pv-beiskammer.at', category: 'construction' },
    { name: 'BIERHOTEL Ranklleiten', location: '4643 Pettenbach', link: 'https://www.ranklleiten.com', category: 'gastro' },
    { name: 'Bildungshaus VILLA ROSENTAL', location: '4663 Laakirchen', link: 'https://www.instituthuemer.at', category: 'healthcare' },
    { name: 'Blumen MUSCARI', location: '4663 Laakirchen', link: 'https://www.muscari.at', category: 'flowers' },
    { name: 'BNP Wirtschaftstreuhand und Steuerberatungs GmbH', location: '4655 Vorchdorf', link: 'https://www.bnp.at', category: 'accounting' },
    { name: 'BP Tankstelle', location: '4655 Vorchdorf', category: 'gas' },
    { name: 'BP Tankstelle', location: '4662 Steyrermühl', category: 'gas' },
    { name: 'BRAUEREI Schloss Eggenberg Stöhr GmbH & Co KG', location: '4655 Vorchdorf', link: 'https://www.schloss-eggenberg.at', category: 'food' },
    { name: 'BUCHEGG ER Johann - Fenster - Sonnenschutz', location: '4655 Vorchdorf', category: 'construction' },
    { name: 'BÄCKEREI, CAFÉ im Gwölb', location: '4655 Vorchdorf', link: 'https://www.im-gwoelb.at', category: 'gastro' },
    { name: 'BÄCKEREI, CAFÉ im Gwölb', location: '4655 Vorchdorf', link: 'https://www.im-gwoelb.at', category: 'food' },
    { name: 'BÄCKEREI, CAFÉ Probst', location: '4655 Vorchdorf', link: 'https://www.baeckerei-probst.at', category: 'gastro' },
    { name: 'BÄCKEREI, CAFÉ Probst', location: '4655 Vorchdorf', link: 'https://www.baeckerei-probst.at', category: 'food' },
    { name: 'BÄCKEREI, CAFÉ Resch&Frisch', location: '4655 Vorchdorf', link: 'https://www.resch-frisch.com', category: 'gastro' },
    { name: 'BÄCKEREI, CAFÉ Resch&Frisch', location: '4655 Vorchdorf', link: 'https://www.resch-frisch.com', category: 'food' },
    { name: 'Café Bäckerei ZACH', location: '4663 Laakirchen', link: 'https://www.zach.baecker.at', category: 'gastro' },
    { name: 'CREATIV OPTIK Plakolm', location: '4655 Vorchdorf', link: 'https://www.plakolm.at', category: 'healthcare' },
    { name: 'CREATIV OPTIK Plakolm', location: '4655 Vorchdorf', link: 'https://www.plakolm.at', category: 'fashion' },
    { name: 'CRW Sports Zordl Yvonne', location: '4655 Vorchdorf', link: 'https://www.crw-sports.net', category: 'cars' },
    { name: 'DENK Klaus, Hotel, Bed & Breakfast', location: '4655 Vorchdorf', link: 'https://www.hoteldenk.at', category: 'gastro' },
    { name: 'DICKINGER Agrarhandel GmbH', location: '4655 Vorchdorf', category: 'construction' },
    { name: 'DICKINGER Agrarhandel GmbH', location: '4655 Vorchdorf', category: 'gas' },
    { name: 'Die STÖTTINGERS', location: '4655 Vorchdorf', link: 'https://www.diestoettingers.at', category: 'healthcare' },
    { name: 'DOLCE Eiscafé', location: '4655 Vorchdorf', category: 'gastro' },
    { name: 'DROGERIE GRÄFINGER - Druckenthanere u. Humanenergetik', location: '4663 Laakirchen', link: 'https://www.drogerie-graefinger.at', category: 'beauty' },
    { name: 'ECKMANN Friseursalon', location: '4663 Laakirchen', category: 'beauty' },
    { name: 'Elektro STEINSCHADEN GmbH', location: '4663 Laakirchen', link: 'https://www.elektro-steinschaden.at', category: 'construction' },
    { name: 'ENERGIEFREUND, Stefan Brunner', location: '4655 Vorchdorf', link: 'https://www.bzr-controls.at', category: 'construction' },
    { name: 'ENI Tankstelle', location: '4655 Vorchdorf', category: 'gas' },
    { name: 'ESTHOFER Auto Team GmbH', location: '4655 Vorchdorf', link: 'https://www.esthofer.com', category: 'cars' },
    { name: 'ETZI-HAUS', location: '4551 Ried/Trkr.', link: 'https://www.etzi-haus.com', category: 'construction' },
    { name: 'EUROWHEEL GmbH', location: '4655 Vorchdorf', link: 'https://www.eurowheel.eu', category: 'cars' },
    { name: 'FDM Danner Metalltechnik GmbH', location: '4663 Laakirchen', link: 'https://www.fdm-metalltechnik.at', category: 'construction' },
    { name: 'FEINE WEINE', location: '4663 Laakirchen', link: 'https://www.feine-weine.at', category: 'food' },
    { name: 'FISCHER Martin, Tabak Trafik', location: '4655 Vorchdorf', category: 'tobacco' },
    { name: 'FIX FAX Bürotechnik HGmbH', location: '4655 Vorchdorf', link: 'https://www.fixfax.at', category: 'it' },
    { name: 'Fleischhauerei KINAST GmbH', location: '4662 Steyrermühl', link: 'https://www.fleischhauerei-kinast.at', category: 'food' },
    { name: 'Fleischhauerei KINAST GmbH', location: '4662 Steyrermühl', link: 'https://www.fleischhauerei-kinast.at', category: 'catering' },
    { name: 'FOTOART', location: '4663 Laakirchen', link: 'https://www.fotoart.at', category: 'photo' },
    { name: 'Foxxy Dance Bar, Strassmayr Hermann', location: '4655 Vorchdorf', link: 'https://www.foxxy.at', category: 'gastro' },
    { name: 'Franz ATTWENGER u. Söhne GmbH', location: '4656 Kirchham', link: 'https://www.attwenger.co.at', category: 'construction' },
    { name: 'FREIBAD Laakirchen', location: '4663 Laakirchen', link: 'https://www.laakirchen.at', category: 'culture' },
    { name: 'FREIBAD Vorchdorf', location: '4655 Vorchdorf', link: 'https://www.vorchdorf.at', category: 'culture' },
    { name: 'FUSSL Modestraße, Mayr GmbH', location: '4655 Vorchdorf', link: 'https://www.fussl.at', category: 'fashion' },
    { name: 'FUZO Coffee & Kitchen', location: '4655 Vorchdorf', link: 'https://www.fuzo-vorchdorf.at', category: 'gastro' },
    { name: 'Fuzzy Dance Bar, Strassmayr Hermann', location: '4655 Vorchdorf', link: 'https://www.fuzzybar.at', category: 'gastro' },
    { name: 'FÜRTBAUER GmbH & Co KG', location: '4663 Laakirchen', link: 'https://www.fuertbauer.at', category: 'construction' },
    { name: 'FÜRTBAUER-Bilanzbuchhaltung', location: '4664 Oberweis', category: 'accounting' },
    { name: 'GASPERLMAYR Elektrotechnik', location: '4655 Vorchdorf', link: 'https://www.etga.at', category: 'construction' },
    { name: 'Gasthaus HINTERREITNER', location: '4655 Vorchdorf', link: 'https://www.ghhinterreitner.at', category: 'gastro' },
    { name: 'Gasthaus THALSTUBE', location: '4663 Laakirchen', link: 'https://www.thalstube.at', category: 'gastro' },
    { name: 'Gasthof BADER', location: '4663 Laakirchen', link: 'https://www.gasthofbader.at', category: 'gastro' },
    { name: 'Gasthof PÖLL', location: '4656 Kirchham', link: 'https://www.gasthauspoell.at', category: 'gastro' },
    { name: 'Gasthof WIRT AM BACH', location: '4664 Oberweis', link: 'https://www.wirtambach.at', category: 'gastro' },
    { name: 'GATSBY - Ihr Platz an der Bar', location: '4655 Vorchdorf', link: 'https://www.gatsby.at', category: 'gastro' },
    { name: 'Getränkegroßhandel WAGNER KG', location: '4664 Laakirchen', link: 'https://www.wagnerweb.at', category: 'food' },
    { name: 'Getränkegroßhandel WAGNER KG', location: '4664 Laakirchen', link: 'https://www.wagnerweb.at', category: 'wholesale' },
    { name: 'GOLLINGER Personenbeförderung', location: '4655 Vorchdorf', link: 'https://www.gollinger.net', category: 'transport' },
    { name: 'GRAROCK Günter, LITO', location: '4655 Vorchdorf', link: 'https://www.lito.at', category: 'catering' },
    { name: 'GRUBER GmbH Landtechnik & Zweiräder/Microcars', location: '4652 Steinerkirchen', link: 'https://www.teamgruber.at', category: 'cars' },
    { name: 'GRUNDNER Solarmontagen GmbH', location: '4655 Vorchdorf', link: 'https://www.grundner-solarmontagen.at', category: 'construction' },
    { name: 'GUNDENDORFER GesmbH', location: '4655 Vorchdorf', link: 'https://www.auto-gundendorfer.at', category: 'cars' },
    { name: 'H.AUStaller GmbH - Haustüren, Fenster, Sonnenschutz', location: '4655 Vorchdorf', link: 'https://www.h-aus.at', category: 'construction' },
    { name: 'HAAN Stefan, Kunstschmiede', location: '4655 Vorchdorf', link: 'https://www.stefan-haan.at', category: 'construction' },
    { name: 'HAARGENAU Helga Lohninger', location: '4655 Vorchdorf', link: 'https://www.haargenau.at', category: 'beauty' },
    { name: 'HAARSTUDIO Bettina Staudinger', location: '4655 Vorchdorf', link: 'https://www.bettina-haarstudio.at', category: 'beauty' },
    { name: 'HARTNER Aggregate und Industrietechnik GmbH', location: '4643 Pettenbach', link: 'https://www.erich-hartner.at', category: 'wholesale' },
    { name: 'Haustechnik Pühringer GmbH', location: '4655 Vorchdorf', link: 'https://www.ht-puehringer.at', category: 'construction' },
    { name: 'HEINZEL STEYRERMÜHL GmbH Heinzel Paper', location: '4662 Steyrermühl', link: 'https://www.heinzelpaper.com', category: 'industry' },
    { name: 'HELIOS-Apotheke', location: '4663 Laakirchen', link: 'https://www.heliosapotheke.at', category: 'healthcare' },
    { name: 'HELLEIN Barbara Personalverrechnung', location: '4655 Vorchdorf', link: 'https://www.hellein.net', category: 'accounting' },
    { name: 'HERMANSEDER Bernhard Trafik', location: '4655 Vorchdorf', category: 'tobacco' },
    { name: 'HerWeinspaziert - Weinhandel', location: '4654 Bad Wimsbach', link: 'https://office@herweinspaziert.at', category: 'gastro' },
    { name: 'HerWeinspaziert - Weinhandel', location: '4654 Bad Wimsbach', link: 'https://office@herweinspaziert.at', category: 'food' },
    { name: 'HESON Metall- u. Kunststofftechnik', location: '4655 Vorchdorf', link: 'https://www.heson.com', category: 'industry' },
    { name: 'HIFI-Studio STENZ', location: '4655 Vorchdorf', link: 'https://www.hifi-studio.at', category: 'construction' },
    { name: 'HILFE IM ALLTAG, Maria Schimpl', location: '4655 Vorchdorf', link: 'https://www.hilfe-im-alltag.at', category: 'services' },
    { name: 'HIP Holzbau GmbH', location: '4655 Vorchdorf', link: 'https://www.hip-holzbau.at', category: 'construction' },
    { name: 'HOCHLEITHNER Schuhe, Sport, Mode', location: '4656 Bad Wimsbach', link: 'https://www.hochleithner.net', category: 'fashion' },
    { name: 'HOCHREITER KFZ GMBH', location: '4656 Kirchham', link: 'https://www.toyota-hochreiter.at', category: 'cars' },
    { name: 'HOFTAVERNE ZIEGELBÖCK', location: '4655 Vorchdorf', link: 'https://www.hoftaverne.at', category: 'gastro' },
    { name: 'HOIDINGER\'S Mostschenke', location: '4663 Laakirchen', link: 'https://www.hoidinger.at', category: 'gastro' },
    { name: 'Humanenergetik PRANAOM Dr. Marina Gundendorfer-Schelber', location: '4655 Vorchdorf', link: 'https://www.pranaom.at', category: 'healthcare' },
    { name: 'HUTTERER Harald J, Elektro', location: '4655 Vorchdorf', category: 'construction' },
    { name: 'ib RAUSCHER - Strom auf allen Ebenen', location: '4655 Vorchdorf', link: 'https://www.ibr.co.at', category: 'construction' },
    { name: 'ID WERKSTATT', location: '4655 Vorchdorf', link: 'https://www.id-werkstatt.at', category: 'construction' },
    { name: 'Ihr INSTALLATEUR mit Feinschliff', location: '4655 Vorchdorf', link: 'https://www.badwerkstatt.at', category: 'construction' },
    { name: 'IMMOWERT Leitner e.u.', location: '4656 Kirchham', link: 'https://www.immowert-leitner.at', category: 'construction' },
    { name: 'IMPERA Immobilien GmbH', location: '4055 Pucking', link: 'https://www.impera-immobilien.at', category: 'construction' },
    { name: 'INFRAROTHEIZUNG Stefan Viechtbauer', location: '4655 Vorchdorf', link: 'https://www.v-infrarot.at', category: 'construction' },
    { name: 'INNOCENTE GesmbH, Dachdecker', location: '4655 Vorchdorf', link: 'https://www.innocente.at', category: 'construction' },
    { name: 'JO\'S RESTAURANT', location: '4655 Vorchdorf', link: 'https://www.jos-restaurant.at', category: 'gastro' },
    { name: 'JO\'S RESTAURANT', location: '4655 Vorchdorf', link: 'https://www.jos-restaurant.at', category: 'catering' },
    { name: 'JURA GmbH', location: '4655 Vorchdorf', link: 'https://www.jura-beschichtung.at', category: 'construction' },
    { name: 'Juwelier GASSENBAUER', location: '4655 Vorchdorf', link: 'https://www.juwelier-gassenbauer.at', category: 'jewelry' },
    { name: 'K.u.F. DRACK GmbH & Co KG', location: '4643 Pettenbach', link: 'https://www.kfd.at', category: 'construction' },
    { name: 'KALKI\'S Hausfleischerei u. Catering', location: '4655 Vorchdorf', link: 'https://www.kalkishausfleischerei.at', category: 'gastro' },
    { name: 'KALKI\'S Hausfleischerei u. Catering', location: '4655 Vorchdorf', link: 'https://www.kalkishausfleischerei.at', category: 'food' },
    { name: 'KALKI\'S Hausfleischerei u. Catering', location: '4655 Vorchdorf', link: 'https://www.kalkishausfleischerei.at', category: 'catering' },
    { name: 'KARMA LOUNGE Cocktails & Kitchen', location: '4655 Vorchdorf', category: 'gastro' },
    { name: 'KIENINGER JESSICA, Hunde- und Katzensalon', location: '4663 Laakirchen', link: 'https://www.hundekatzensalon.com', category: 'services' },
    { name: 'KITZMANTELFABRIK', location: '4655 Vorchdorf', link: 'https://www.kitzmantelfabrik.at', category: 'culture' },
    { name: 'KREATIVE BLUMEREI', location: '4664 Oberweis', link: 'https://www.kreative-blumerei.at', category: 'flowers' },
    { name: 'KRENMAYR KG, Thomas Krenmayr', location: '4655 Vorchdorf', link: 'https://www.blumen-krenmayr.at', category: 'flowers' },
    { name: 'KRONBERGER Autohaus GmbH', location: '4656 Kirchham', link: 'https://www.ford-kronberger.at', category: 'cars' },
    { name: 'KÖNIGSWIESER Gerätetechnik', location: '4655 Vorchdorf', link: 'https://www.koenigswieser.com', category: 'industry' },
    { name: 'LAAKIRCHEN PAPIER AG Heinzel Paper', location: '4663 Laakirchen', link: 'https://www.heinzelpaper.com', category: 'industry' },
    { name: 'LAGERHAUS Vorchdorf', location: '4655 Vorchdorf', link: 'https://www.lagerhaus.at', category: 'construction' },
    { name: 'LAGERHAUS Vorchdorf', location: '4655 Vorchdorf', link: 'https://www.lagerhaus.at', category: 'construction' },
    { name: 'Landschaftspflege PREINSTORFER', location: '4655 Vorchdorf', link: 'https://www.landschaftspflege-preinstorfer.at', category: 'services' },
    { name: 'LANG Schuhmode', location: '4655 Vorchdorf', link: 'https://www.fmzvorchdorf.at', category: 'fashion' },
    { name: 'LEATHER ROSE, Rosemarie Spitzbart', location: '4655 Vorchdorf', link: 'https://www.leatherrose.at', category: 'jewelry' },
    { name: 'LEISS Kfz', location: '4655 Vorchdorf', link: 'https://www.kfz-leiss.at', category: 'cars' },
    { name: 'LEITHINGER, Gärtnerei und Blumen', location: '4655 Vorchdorf', link: 'https://www.gaertnerei-leithinger.at', category: 'flowers' },
    { name: 'LG-Tiefbau GmbH', location: '4652 Steinerkirchen', link: 'https://www.lg-tiefbau.at', category: 'construction' },
    { name: 'Lichtland RITTENSCHOBER KG', location: '4816 Gschwandt', link: 'https://www.lichtland.at', category: 'construction' },
    { name: 'LOHNINGER GmbH, Erdbau', location: '4655 Vorchdorf', link: 'https://www.erdbau-lohninger.at', category: 'construction' },
    { name: 'LOIDL Michael, Tabak Trafik', location: '4663 Laakirchen', category: 'tobacco' },
    { name: 'LUMETSBERGER Elke, florale elements', location: '4655 Vorchdorf', link: 'https://www.elke-lumetsberger.at', category: 'flowers' },
    { name: 'LÜFTINGER Baugesellschaft mbH', location: '4654 Bad Wimsbach', link: 'https://www.lueftingerbau.at', category: 'construction' },
    { name: 'MAIR DACH GmbH', location: '4655 Vorchdorf', link: 'https://www.maier-dach.at', category: 'construction' },
    { name: 'MARKTGEMEINDE Vorchdorf', location: '4655 Vorchdorf', link: 'https://www.vorchdorf.at', category: 'services' },
    { name: 'MARMORSTEIN, Arkan Bülent', location: '4655 Vorchdorf', link: 'https://www.marmorstein.at', category: 'construction' },
    { name: 'MARTETSCHLÄGER mbH, Kachelofen und Fliesen', location: '4655 Vorchdorf', link: 'https://www.martetschlaeger.net', category: 'construction' },
    { name: 'McDonald\'s Vorchdorf', location: '4655 Vorchdorf', category: 'gastro' },
    { name: 'MEIN TRAINING Vorchdorf', location: '4655 Vorchdorf', link: 'https://www.mein-training.at', category: 'beauty' },
    { name: 'METALLBAU Prielinger GmbH', location: '4655 Vorchdorf', link: 'https://www.st-prielinger.com', category: 'construction' },
    { name: 'MEYER Logistik', location: '4655 Vorchdorf', link: 'https://www.meyer-logistik.at', category: 'industry' },
    { name: 'MICHLHOF zu Haitzing', location: '4663 Laakirchen', link: 'https://www.michlhof-haitzing.at', category: 'gastro' },
    { name: 'MICHLHOF zu Haitzing', location: '4663 Laakirchen', link: 'https://www.michlhof-haitzing.at', category: 'catering' },
    { name: 'MOBILE PFLEGE Marina Nußbaumer', location: '4655 Vorchdorf', link: 'https://www.mobilepflegenussbaumer.at', category: 'services' },
    { name: 'Mobiles Sägewerk FÜRTBAUER', location: '4694 Ohlsdorf', link: 'https://mobiles.saegewerk.fuertbauer@gmail.com', category: 'services' },
    { name: 'Mobiles Sägewerk FÜRTBAUER', location: '4694 Ohlsdorf', link: 'https://mobiles.saegewerk.fuertbauer@gmail.com', category: 'construction' },
    { name: 'Moden BAUMGARTNER', location: '4663 Laakirchen', category: 'fashion' },
    { name: 'MOORBAD Gmös', location: '4663 Laakirchen', link: 'https://www.moorbad-gmoes.at', category: 'healthcare' },
    { name: 'MÜLLER Kraftfahrzeug GesmbH', location: '4654 Bad Wimsbach', link: 'https://www.kfz-mueller.at', category: 'cars' },
    { name: 'MÜLLER Tankstellen GesmbH', location: '4812 St. Konrad', category: 'gas' },
    { name: 'NAHWÄRME Vorchdorf', location: '4655 Vorchdorf', link: 'https://www.nahwaermevorchdorf.at', category: 'services' },
    { name: 'NKD Österreich GmbH', location: '4655 Vorchdorf', link: 'https://www.nkd.at', category: 'fashion' },
    { name: 'NKD Österreich GmbH', location: '4663 Laakirchen', link: 'https://www.nkd.at', category: 'fashion' },
    { name: 'NOTARIAT Mag. Thomas Wilthoner', location: '4655 Vorchdorf', link: 'https://www.notar-wilthoner.at', category: 'legal' },
    { name: 'OBERBANK Laakirchen', location: '4663 Laakirchen', link: 'https://www.oberbank.at', category: 'banks' },
    { name: 'OBERÖSTERREICH.TV', location: '4650 Lambach', link: 'https://www.oberoesterreich.tv', category: 'advertising' },
    { name: 'PALMAN Oliver, Meistermaler', location: '4655 Vorchdorf', link: 'https://www.palman.co.at', category: 'construction' },
    { name: 'PAPIERWELT MUSEUM und ALFA', location: '4662 Steyrermühl', link: 'https://www.papiermuseum.at', category: 'culture' },
    { name: 'PAYRHUBER Elektro GmbH', location: '4655 Vorchdorf', link: 'https://www.elektro-payrhuber.at', category: 'construction' },
    { name: 'PEARLE Optik Vorchdorf', location: '4655 Vorchdorf', link: 'https://www.pearle.at', category: 'healthcare' },
    { name: 'PEARLE Optik Vorchdorf', location: '4655 Vorchdorf', link: 'https://www.pearle.at', category: 'fashion' },
    { name: 'PFATSCHBACHER Florian', location: '4810 Gschwandt', link: 'https://www.pfatschbacher-photography.at', category: 'photo' },
    { name: 'PICHELSBERGER Autohaus GmbH', location: '4655 Vorchdorf', link: 'https://www.pichelsberger.at', category: 'cars' },
    { name: 'PLAICHINGER Karl GesmbH', location: '4663 Laakirchen', category: 'food' },
    { name: 'PLAICHINGER Karl GesmbH', location: '4655 Vorchdorf', category: 'construction' },
    { name: 'POWER Networks GmbH', location: '4655 Vorchdorf', link: 'https://www.powernetworks.at', category: 'it' },
    { name: 'PROCONSULT Wirtschaftsprüfung und Steuerberatung GmbH & Co KG', location: '4655 Vorchdorf', link: 'https://www.proconsult-wt.at', category: 'accounting' },
    { name: 'proUmwelt GmbH Limberger', location: '4655 Vorchdorf', link: 'https://www.proumwelt.at', category: 'services' },
    { name: 'PÖLL GesmbH & Co KG Fleisch- und Wurstspezialitäten', location: '4655 Vorchdorf', link: 'https://www.poell-vorchdorf.at', category: 'food' },
    { name: 'PÖLL GesmbH & Co KG Fleisch- und Wurstspezialitäten', location: '4655 Vorchdorf', link: 'https://www.poell-vorchdorf.at', category: 'catering' },
    { name: 'RAIFFEISENBANK Salzkammergut', location: '4655 Vorchdorf & 4663 Laakirchen', link: 'https://www.raiffeisen-ooe.at/salzkammergut', category: 'banks' },
    { name: 'RAUCH Armin, Werbeagentur', location: '4655 Vorchdorf', link: 'https://www.ungleich.at', category: 'advertising' },
    { name: 'Rechtsanwalt Dr. Horst MAYR', location: '4655 Vorchdorf', link: 'https://www.ra-mayr.at', category: 'legal' },
    { name: 'Rechtsanwälte Mag. Daniela AIGNER, Mag. Georg LAMPL', location: '4655 Vorchdorf', link: 'https://www.kanzlei-vorchdorf.at', category: 'legal' },
    { name: 'REGIO INTAKT Beratung', location: '4655 Vorchdorf', link: 'https://www.regiointakt.at', category: 'services' },
    { name: 'Reisen FRÖCH', location: '4663 Laakirchen', link: 'https://www.froech-reisen.at', category: 'culture' },
    { name: 'Reisen FRÖCH', location: '4663 Laakirchen', link: 'https://www.froech-reisen.at', category: 'transport' },
    { name: 'ReVital Shop Vorchdorf', location: '4655 Vorchdorf', category: 'fashion' },
    { name: 's\'GSCHÄFT UMS ECK', location: '4653 Eberstalzell', category: 'food' },
    { name: 's\'GSCHÄFT UMS ECK', location: '4653 Eberstalzell', category: 'catering' },
    { name: 'SCHATZL .ONLINE', location: '4655 Vorchdorf', link: 'https://www.schatzl.online', category: 'it' },
    { name: 'SCHATZL .ONLINE', location: '4655 Vorchdorf', link: 'https://www.schatzl.online', category: 'advertising' },
    { name: 'SCHIESSL Kältetechnik m.b.H.', location: '4655 Vorchdorf', link: 'https://www.schiessl.at', category: 'industry' },
    { name: 'SCHMALWIESER Bastel-, Schul- und Nähbedarf, Stoffe', location: '4655 Vorchdorf', category: 'construction' },
    { name: 'SCHNEEBERGER Karl, Schwimmbad-Montage-Technik e.U.', location: '4655 Vorchdorf', link: 'https://www.schwimmbad1a.at', category: 'construction' },
    { name: 'SCHNITT VISION Lisa Thalinger', location: '4655 Vorchdorf', link: 'https://www.schnittvision.at', category: 'beauty' },
    { name: 'SCHNITT VISION Lisa Thalinger', location: '4662 Steyrermühl', link: 'https://www.schnittvision.at', category: 'beauty' },
    { name: 'SCHWABEGGER Optik, Hörgeräte, Contactlinsen', location: '4655 Vorchdorf', link: 'https://www.schwabegger.at', category: 'healthcare' },
    { name: 'SCHWABEGGER Optik, Hörgeräte, Contactlinsen', location: '4655 Vorchdorf', link: 'https://www.schwabegger.at', category: 'fashion' },
    { name: 'SECONDHAND FARBENFROH', location: '4662 Steyrermühl', category: 'fashion' },
    { name: 'SEYR Harald GmbH, Dachdecker', location: '4654 Bad Wimsbach', link: 'https://www.seyr.org', category: 'construction' },
    { name: 'SFK GmbH', location: '4656 Kirchham', link: 'https://www.sfk.at', category: 'construction' },
    { name: 'SHELL Tankstelle', location: '4662 Steyrermühl', category: 'gas' },
    { name: 'SHIATSU MASSAGE Carmen Adamsmair', location: '4655 Vorchdorf', link: 'https://www.massagecarmen.at', category: 'healthcare' },
    { name: 'SODIAN Immobilien', location: '4655 Vorchdorf', link: 'https://www.sodian-immobilien.at', category: 'construction' },
    { name: 'SPAR Markt Hessenberger', location: '4663 Laakirchen', category: 'food' },
    { name: 'SPAR Österr. Warenhandels AG', location: '4655 Vorchdorf', link: 'https://www.spar.at', category: 'food' },
    { name: 'SPARKASSE Laakirchen', location: '4663 Laakirchen', link: 'https://www.sparkasse.at', category: 'banks' },
    { name: 'SPARKASSE Vorchdorf', location: '4655 Vorchdorf', link: 'https://www.sparkasse.at/lambach', category: 'banks' },
    { name: 'SPC Gebäudetechnik', location: '4656 Kirchham', link: 'https://www.spc-technik.at', category: 'construction' },
    { name: 'SPITZBART Paulus - Tischlerei', location: '4663 Laakirchen', link: 'https://www.floorcover.at', category: 'construction' },
    { name: 'SPS Bruderhofer', location: '4655 Vorchdorf', link: 'https://www.sps-bruderhofer.at', category: 'construction' },
    { name: 'STADT Apotheke', location: '4663 Laakirchen', link: 'https://www.stadtapo-laakirchen.at', category: 'healthcare' },
    { name: 'STADTGEMEINDE Laakirchen', location: '4663 Laakirchen', link: 'https://www.laakirchen.at', category: 'services' },
    { name: 'STEINER\'S Fiaker', location: '4663 Laakirchen', link: 'https://www.fiaker.steiners-restaurants.at', category: 'gastro' },
    { name: 'Steinmetzmeister LITTRINGER', location: '4663 Laakirchen', link: 'https://www.littringer-stein.at', category: 'construction' },
    { name: 'STERN & HAFFERL Verkehrs GesmbH', location: '4810 Gmunden', link: 'https://www.stern-verkehr.at', category: 'transport' },
    { name: 'STUCO GmbH', location: '4655 Vorchdorf', link: 'https://www.stuco.com', category: 'wholesale' },
    { name: 'STÖTTINGER Immobilien, Michael Stöttinger', location: '4655 Vorchdorf', link: 'https://www.stoettinger-immobilien.at', category: 'construction' },
    { name: 'SUSANNE.ANZIEHEND', location: '4655 Vorchdorf', link: 'https://www.susanneanzlehend.at', category: 'fashion' },
    { name: 'Team DOGTRAINING, Dominik Söllradl', location: '4655 Vorchdorf', link: 'https://www.dogtraining.at', category: 'services' },
    { name: 'Thomas GÖTSCHHOFER GesmbH', location: '4655 Vorchdorf', link: 'https://www.gut-durchdacht.at', category: 'construction' },
    { name: 'TISCHLEREI Bernhard Radner', location: '4655 Vorchdorf', category: 'construction' },
    { name: 'Tischlerei STELZHAMMER GmbH', location: '4663 Laakirchen', category: 'construction' },
    { name: 'Traunseeschifffahrt Karlheinz Eder', location: '4810 Gmunden', link: 'https://www.traunseeschifffahrt.at', category: 'transport' },
    { name: 'TRAUNSTEIN Reinigung Tamara Huemer', location: '4655 Vorchdorf', link: 'https://www.textilreinigung-traunstein.at', category: 'services' },
    { name: 'TVM Versicherungsmakler GmbH', location: '4560 Kirchdorf', link: 'https://www.tvm.at', category: 'banks' },
    { name: 'VINOLINO, Laszl Gerhard', location: '4655 Vorchdorf', category: 'gastro' },
    { name: 'VMB Laakirchen', location: '4663 Laakirchen', link: 'https://www.vmb-laakirchen.at', category: 'banks' },
    { name: 'VOGELHUBERGUT Fam. Scherleithner', location: '4655 Vorchdorf', link: 'https://www.vogelhubergut.at', category: 'gastro' },
    { name: 'VOLKSKREDITBANK AG', location: '4655 Vorchdorf', link: 'https://www.vkb-bank.at', category: 'banks' },
    { name: 'VORCHDORFMEDIA e.U., Mag. Gerhard Radner', location: '4655 Vorchdorf', link: 'https://www.vorchdorfmedia.at', category: 'advertising' },
    { name: 'WAGENHAUS GmbH', location: '4655 Vorchdorf', link: 'https://www.wagenhaus.at', category: 'cars' },
    { name: 'WELTLADEN', location: '4655 Vorchdorf', link: 'https://www.weltladenvorchdorf.at', category: 'food' },
    { name: 'WELTLADEN', location: '4655 Vorchdorf', link: 'https://www.weltladenvorchdorf.at', category: 'fashion' },
    { name: 'WESTREICHER, MR Dr. Claudia', location: '4655 Vorchdorf', link: 'https://www.westreicher.at', category: 'healthcare' },
    { name: 'WIEDL\'S Taxi', location: '4655 Vorchdorf', link: 'https://www.taxi-wiedl.at', category: 'transport' },
    { name: 'WIRT in der Edt, Fam. Radner', location: '4655 Vorchdorf', link: 'https://www.wirt-edt.at', category: 'gastro' },
    { name: 'WohnPlanerin RAFFELSBERGER Eva', location: '4655 Vorchdorf', link: 'https://www.wohnplanerin.at', category: 'construction' },
    { name: 'Wohnstudio Johannes HUTTERER', location: '4663 Laakirchen', link: 'https://www.moderne-kuechen.at', category: 'construction' },
    { name: 'ZAMBELLI Industrieprodukte KG', location: '4655 Vorchdorf', link: 'https://www.zambelli-ip.at', category: 'services' },
    { name: 'ZOPF Schmuck, Uhren, Optik', location: '4663 Laakirchen', link: 'https://www.zopf-optik.at', category: 'healthcare' },
    { name: 'ZOPF Schmuck, Uhren, Optik', location: '4663 Laakirchen', link: 'https://www.zopf-optik.at', category: 'jewelry' },
    { name: 'ZUMBA Andrea', location: '4655 Vorchdorf', category: 'beauty' },
    { name: 'ZWIRN - Café Bar Osteria', location: '4655 Vorchdorf', link: 'https://www.cafezwirn.at', category: 'gastro' },
    { name: 'ZWIRN - Café Bar Osteria', location: '4655 Vorchdorf', link: 'https://www.cafezwirn.at', category: 'catering' },
];

// --- DATEN: HAUPTKATEGORIEN ---
const categories = {
    events: {
        id: 'events',
        title: 'Veranstaltungen',
        icon: '📅',
        description: 'Events, Konzerte & Feste',
        externalLink: 'events.html'
    },
    gallery: {
        id: 'gallery',
        title: 'Bilder & Galerie',
        icon: '📸',
        description: 'Vorchdorf in Fotos',
        externalLink: 'http://www.vorchdorfer.at/'
    },
    flohmarkt: {
        id: 'flohmarkt',
        title: 'Flohmarkt',
        icon: '🏷️',
        description: 'Angebote der Community',
        content: {
            type: 'flohmarkt_placeholder'
        }
    },
    welcome: {
        id: 'welcome',
        title: 'Willkommen',
        icon: '🏠',
        description: 'Erste Infos',
        content: {
            type: 'info',
            sections: [
                {
                    title: 'Herzlich Willkommen!',
                    items: [{ title: 'Gemeindeamt', info: ['Schloßplatz 7, 4655 Vorchdorf'], link: 'https://www.vorchdorf.at' }]
                }
            ]
        }
    },
    health: {
        id: 'health',
        title: 'Gesundheit',
        icon: '🏥',
        description: 'Ärzte & Apotheken',
        subcategories: {
            doctors: { title: '👨‍⚕️ Ärzte', items: [{ title: 'Dr. Gruber', info: ['Praktische Ärztin'], link: 'https://www.gruberdoktor.at/' }] }
        }
    },
    education: {
        id: 'education',
        title: 'Bildung',
        icon: '🎓',
        description: 'Schulen & Kindergärten',
        content: {
            type: 'list',
            items: [{ title: 'Volksschule Vorchdorf', link: 'https://www.vorchdorf.at' }]
        }
    },
    shopping: {
        id: 'shopping',
        title: 'Einkaufen',
        icon: '🛍️',
        description: 'Betriebe & Werbering',
        subcategories: {
            construction: { id: 'construction', title: '🏠 Bauen & Wohnen' },
            beauty: { id: 'beauty', title: '💪 Beauty & Fitness' },
            gastro: { id: 'gastro', title: '🍽️ Gastronomie' },
            food: { id: 'food', title: '🛒 Lebensmittel' },
            fashion: { id: 'fashion', title: '👗 Mode' }
        }
    },
    mobility: {
        id: 'mobility',
        title: 'Mobilität',
        icon: '🚌',
        description: 'Bus, Bahn & Taxi',
        subcategories: {
            taxi_quick: { id: 'taxi_quick', title: '☎️ Taxi anrufen', description: 'Direktwahl' },
            public: { id: 'public', title: 'Öffis', items: [{ title: 'Vorchdorfer Bahn', link: 'https://www.vorchdorferbahn.at/' }] }
        }
    },
    emergency: {
        id: 'emergency',
        title: 'Notfall',
        icon: '🆘',
        description: 'Wichtige Nummern',
        content: {
            type: 'info',
            sections: [{ title: 'Notruf', items: [{ title: 'Rettung', info: ['144'] }] }]
        }
    }
};

// --- FUNKTIONEN: INITIALISIERUNG ---
function init() {
    renderHome();
    document.getElementById('versionInfo').textContent = ' | Version ' + APP_VERSION;
}

// --- FUNKTIONEN: NAVIGATION ---
function renderHome() {
    currentView = 'home';
    navigationHistory = [];
    
    document.getElementById('emergencyBanner').classList.remove('hidden');
    document.getElementById('breadcrumb').classList.add('hidden');
    document.getElementById('backButton').classList.add('hidden');

    const mainContent = document.getElementById('mainContent');
    
    // Wetter laden
    fetchWeather().then(data => {
        const weatherHtml = data ? renderWeather(data) : '';
        document.getElementById('weatherWidget').innerHTML = weatherHtml;
        document.getElementById('weatherWidget').classList.toggle('hidden', !data);
    });

    // Kategorien-Grid (Hauptseite)
    mainContent.innerHTML = `
        <div class="cards-grid">
            ${Object.values(categories).map(cat => `
                <div class="card" onclick="navigateToCategory('${cat.id}')">
                    <span class="card-icon">${cat.icon}</span>
                    <h3>${cat.title}</h3>
                    <p>${cat.description}</p>
                </div>
            `).join('')}
        </div>
    `;
}

function navigateToCategory(categoryId) {
    const category = categories[categoryId];
    if (category.externalLink) {
        window.location.href = category.externalLink;
        return;
    }

    currentCategory = categoryId;
    navigationHistory.push({ type: 'home' });

    document.getElementById('emergencyBanner').classList.add('hidden');
    document.getElementById('backButton').classList.remove('hidden');
    updateBreadcrumb([{ text: category.title }]);

    const mainContent = document.getElementById('mainContent');

    if (category.subcategories) {
        mainContent.innerHTML = `
            <div class="subcategory-list">
                ${Object.entries(category.subcategories).map(([subId, sub]) => `
                    <div class="card" onclick="navigateToSubcategory('${categoryId}', '${subId}')">
                        <span class="card-icon">${sub.icon || '📂'}</span>
                        <h3>${sub.title}</h3>
                        <p>${sub.description || 'Details anzeigen'}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        mainContent.innerHTML = renderContent(category);
    }
}

function navigateToSubcategory(categoryId, subId) {
    const sub = categories[categoryId].subcategories[subId];
    navigationHistory.push({ type: 'category', categoryId });
    updateBreadcrumb([
        { text: categories[categoryId].title, action: `navigateToCategory('${categoryId}')` },
        { text: sub.title }
    ]);

    const mainContent = document.getElementById('mainContent');

    // Wenn Shopping -> Filter Betriebe
    if (categoryId === 'shopping') {
        const filtered = allBusinesses.filter(b => b.category === subId);
        mainContent.innerHTML = `
            <div class="cards-grid">
                ${filtered.map(b => `
                    <div class="card" onclick="${b.link ? `window.open('${b.link}')` : ''}">
                        <h3>${b.name}</h3>
                        <p>📍 ${b.location}</p>
                        ${b.link ? '<span style="color:blue; font-size:0.7rem;">Website besuchen</span>' : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } else if (sub.items) {
        mainContent.innerHTML = `
            <div class="cards-grid">
                ${sub.items.map(item => `
                    <div class="card" onclick="${item.link ? `window.open('${item.link}')` : ''}">
                        <h3>${item.title}</h3>
                        ${item.info ? item.info.map(i => `<p>${i}</p>`).join('') : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// --- HELPER: CONTENT RENDERER ---
function renderContent(category) {
    if (category.content?.type === 'flohmarkt_placeholder') {
        return `<div class="card" style="aspect-ratio:auto; padding:40px;">
                    <h2>Flohmarkt folgt</h2>
                    <p>Hier binden wir bald Google Sheets an!</p>
                </div>`;
    }
    return `<div class="card" style="aspect-ratio:auto; padding:20px;">
                <h2>${category.title}</h2>
                <p>Inhalt wird geladen...</p>
            </div>`;
}

// --- HELPER: WETTER ---
async function fetchWeather() {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=48.0039&longitude=13.9485&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe/Vienna`);
        const data = await res.json();
        return data.daily;
    } catch (e) { return null; }
}

function renderWeather(data) {
    return `<div style="background: white; padding: 15px; border-radius: 15px; margin-bottom: 20px; box-shadow: var(--shadow); display: flex; justify-content: space-around;">
        ${data.time.slice(0, 3).map((d, i) => `
            <div style="text-align:center;">
                <small>${new Date(d).toLocaleDateString('de-DE', {weekday:'short'})}</small>
                <div style="font-size:1.5rem;">🌤️</div>
                <strong>${Math.round(data.temperature_2m_max[i])}°</strong>
            </div>
        `).join('')}
    </div>`;
}

// --- HELPER: UI ---
function goBack() {
    const last = navigationHistory.pop();
    if (!last || last.type === 'home') renderHome();
    else if (last.type === 'category') navigateToCategory(last.categoryId);
}

function goHome() {
    renderHome();
}

function updateBreadcrumb(items) {
    const bc = document.getElementById('breadcrumb');
    bc.classList.remove('hidden');
    bc.innerHTML = '<span onclick="goHome()">🏠 Start</span>' + 
                   items.map(i => ` › <span onclick="${i.action || ''}">${i.text}</span>`).join('');
}

// --- INITIALISIERUNG STARTEN ---
document.addEventListener('DOMContentLoaded', init);
