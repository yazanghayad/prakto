import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integritetspolicy - Prakto',
  robots: {
    index: false
  }
};

export default function PrivacyPolicyPage() {
  return (
    <div className='min-h-screen px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl space-y-8'>
        {/* Main Heading */}
        <div className='text-center'>
          <h1 className='text-foreground text-3xl font-bold'>Integritetspolicy för Prakto</h1>
          <p className='text-muted-foreground mt-2 text-base'>
            Skyddet för dina personuppgifter är av högsta vikt för oss. I integritetspolicyn kan du
            läsa om hur vi behandlar dina personuppgifter och vilka rättigheter du har beträffande
            personuppgifter.
          </p>
        </div>

        {/* Personuppgiftsansvarig */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Personuppgiftsansvarig</h2>
          <div className='text-muted-foreground text-base leading-relaxed'>
            <p>Personuppgiftsansvarig för behandlingen av dina personuppgifter är:</p>
            <div className='mt-2'>
              <p className='font-medium'>Prakto Sverige AB</p>
              <p>Org nr: 556597-9878</p>
              <p>Karlslundsvägen 8</p>
              <p>177 44 Järfälla</p>
            </div>
          </div>
        </section>

        {/* Vilka uppgifter */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            Vilka och varifrån samlar vi in personuppgifter?
          </h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            När du är i kontakt med oss (t.ex. vid köp, ifyllande av formulär eller besök på
            webbsidan) samlar vi in personuppgifter om dig. De uppgifter vi samlar in är namn,
            personnummer, adress, e-postadress och telefonnummer, köp-, order- och
            användningshistorik, IP-adress samt information som du lämnar till vår kundtjänst.
          </p>
        </section>

        {/* Definitioner */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Definitioner</h2>
          <div className='text-muted-foreground space-y-4 text-base leading-relaxed'>
            <p>
              Personuppgifter är all information som relaterar till en identifierad eller
              identifierbar fysisk person. Sådan data kan till exempel vara namn, bild,
              personnummer, e-postadress och hemadress, IP-adress, information om kompetens,
              utbildning eller tidigare erfarenhet. Även om en enda uppgift kanske inte räcker för
              att identifiera dig som individ, kan en uppgift utgöra Personuppgifter om den, i
              kombination med andra uppgifter kan kopplas till dig.
            </p>
            <p>
              &ldquo;Behandling&rdquo; av Personuppgifter betyder i huvudsak en åtgärd eller
              kombination av åtgärder beträffande Personuppgifter, såsom insamling, registrering,
              organisering, strukturering, lagring, bearbetning eller ändring, framtagning, läsning,
              användning, utlämning genom överföring, spridning eller tillhandahållande på annat
              sätt, justering eller sammanförande, begränsning, radering eller förstöring.
            </p>
          </div>
        </section>

        {/* Vilka personuppgifter och varför */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            Vilka Personuppgifter samlas in och varför?
          </h2>
          <div className='text-muted-foreground space-y-4 text-base leading-relaxed'>
            <p>
              Vi samlar in uppgifter när du till exempel använder våra tjänster, registrerar dig för
              våra kurser och seminarier, prenumererar på vårt nyhetsbrev, ansöker om jobb, deltar i
              enkäter eller kontaktar oss i olika typer av frågor.
            </p>
            <p>
              Vi samlar även in Personuppgifter som är nödvändiga för att administrera din
              kundrelation med oss och för att tillhandahålla tjänster i enlighet med vårt
              ömsesidiga avtal. Detta inkluderar vanligtvis information som ditt namn och
              telefonnummer, din adress och e-postadress, men kan också innehålla annan information,
              till exempel IP-adress. Vi kan samla in Personuppgifter om dig från olika källor.
            </p>
          </div>
        </section>

        {/* Automatiskt insamlade uppgifter */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            Uppgifter som hämtas in automatiskt
          </h2>
          <div className='text-muted-foreground space-y-4 text-base leading-relaxed'>
            <p>
              Vi (och tredje parts tjänsteleverantörer som agerar på våra vägnar) använder cookies
              och andra verktyg (som webbanalysverktyg och pixeltaggar) för att automatiskt samla in
              information om dig när du använder vår webbplats, med förbehåll för villkoren i denna
              Integritetspolicy och tillämpliga lagar och förordningar. De typer av uppgifter som
              samlas in automatiskt kan innehålla:
            </p>
            <ol className='list-decimal space-y-1 pl-6'>
              <li>Information om vilken typ av webbläsare du använder</li>
              <li>Användarbeteende och interaktionsdata för de webbsidor du har tittat på</li>
              <li>Din IP-adress</li>
              <li>Språket i din webbläsare</li>
              <li>Din geografiska plats (begränsad till stad och land)</li>
              <li>Din nätoperatör</li>
            </ol>
            <p>
              Vi kan få Personuppgifter om dig från andra legitima källor, inklusive information
              från kommersiellt tillgängliga källor, såsom offentliga databaser och
              data-aggregatörer, samt information från tredje part. De typer av Personuppgifter som
              vi kan hämta från sådana källor inkluderar: namn, adress, e-postadress, telefonnummer,
              faxnummer, titel och arbetsplats, samt referenser (vid anställningsprocess).
            </p>
          </div>
        </section>

        {/* Syfte */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            För vilket syfte Behandlas Personuppgifter?
          </h2>
          <div className='text-muted-foreground text-base leading-relaxed'>
            <p className='mb-3'>De Personuppgifter som vi samlar om dig kommer att användas för:</p>
            <ul className='list-disc space-y-1 pl-6'>
              <li>Att följa lagliga krav eller lagliga auktoritetsförfrågningar</li>
              <li>Administrativa och interna affärsändamål</li>
              <li>
                Att förse dig med produkter och tjänster samt att informera dig om nya produkter,
                tjänster och evenemang
              </li>
              <li>
                Att utvärdera och förbättra vårt erbjudande till, och kommunikation med, kunder
              </li>
              <li>Utveckling av vår verksamhet och våra tjänster</li>
              <li>Databehandling för reklamändamål</li>
              <li>Statistik</li>
            </ul>
          </div>
        </section>

        {/* Rättslig förpliktelse */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            Behandling på grund av rättslig förpliktelse
          </h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Behandling av Personuppgifter är också tillåtet om nationell lagstiftning begär, kräver
            eller tillåter detta. Typen och omfattningen av Behandlingen måste vara nödvändig för
            den lagligt godkända databehandlingsverksamheten och måste följa gällande
            lagbestämmelser.
          </p>
        </section>

        {/* Berättigade intressen */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            Behandling på grund av berättigade intressen
          </h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Personuppgifter kan också behandlas om det är nödvändigt för ett berättigat intresse hos
            oss. Berättigade intressen är i allmänhet rättsliga (t.ex. insamling av utestående
            fordringar) eller kommersiell karaktär (t.ex. undvikande av kontraktsbrott). Vi kan till
            exempel ha ansett att vi har ett berättigat intresse för att kunna uppfylla våra
            skyldigheter gentemot dig och att administrera ditt kundkonto.
          </p>
        </section>

        {/* Användardata och internet */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Användardata och internet</h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Om Personuppgifter samlas in, bearbetas och används på webbplatser eller i appar måste
            de registrerade informeras om detta i ett integritetsutlåtande och i förekommande fall
            informeras om cookies. Integritetsutlåtanden och eventuell cookies information måste
            integreras så att de är lätta att identifiera, direkt tillgängliga och konsekvent
            tillgängliga för de registrerade. Om användningsprofiler (spårning) skapas för att
            utvärdera användningen av webbplatser och appar, måste de registrerade alltid informeras
            i integritetsutlåtandet. Personlig spårning får endast utföras om det är tillåtet enligt
            nationell lagstiftning eller efter samtycke från den registrerade.
          </p>
        </section>

        {/* Lagringstid */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            Hur länge lagras Personuppgifter?
          </h2>
          <div className='text-muted-foreground space-y-4 text-base leading-relaxed'>
            <p>
              Den information vi samlar om dig kommer att sparas under vår affärsrelation med
              kunden. Vi kommer dock att ta bort din personliga information tre (3) år från när
              affärsrelationen avslutats. Observera att vissa uppgifter måste lagras under en längre
              tid, även efter att ett affärsförhållande har avslutats, när det krävs enligt
              nationell lagstiftning.
            </p>
            <p>
              Ingen information om dig kommer att sparas längre än vad som är nödvändigt eller på
              ett sätt som strider mot lagen.
            </p>
          </div>
        </section>

        {/* Utgivande */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>
            Utgivande av personuppgifter
          </h2>
          <div className='text-muted-foreground space-y-4 text-base leading-relaxed'>
            <p>
              Vi har rätt att anlita Underbiträden för att Behandla Personuppgifter på dina vägnar.
              Vi förbinder oss att informera dig om våra möjliga planer på att anställa och/eller
              ersätta ett Underbiträde, vilket ger dig möjlighet att göra invändningar mot sådana
              ändringar.
            </p>
            <p>
              Företag som Behandlar Personuppgifter på våra vägnar kommer alltid att ingå ett
              personuppgiftsbiträdesavtal med oss för att säkerställa att en hög skyddsnivå för dina
              Personuppgifter upprätthålls av våra partners.
            </p>
            <p>
              Dina Personuppgifter kan också lämnas ut till tredje part när (i) det krävs enligt
              lag, andra lagstadgade eller statliga beslut, eller (ii) information lämnas till
              försäkringsbolag, banker eller förmånspartners. Vi kommer inte att avslöja dina
              Personuppgifter i någon annan mån än vad som beskrivs.
            </p>
          </div>
        </section>

        {/* Rättigheter */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Dina rättigheter</h2>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Du har rätt att, i enlighet med gällande dataskyddslagar, begära tillgång till de
            Personuppgifter som Behandlas om dig när som helst. Du har också rätt att få felaktiga
            Personuppgifter om dig korrigerade, begära att vi raderar dina Personuppgifter, begränsa
            vår Behandling av dina Personuppgifter, utöva din rätt till dataportabilitet och
            motsätta dig Behandlingen av dina Personuppgifter. När Behandlingen baseras på samtycke
            har du rätt att återkalla ditt samtycke till den Behandlingen när som helst.
          </p>
        </section>

        {/* Cookies */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Cookies</h2>
          <div className='text-muted-foreground space-y-4 text-base leading-relaxed'>
            <p>
              Vi använder cookies på denna webbplats. En cookie är en liten del data som skickas
              från en webbsida och som lagras i en användares webbläsare, mobiltelefon, surfplatta
              eller annan enhet medan användaren surfar på webbsidan. En cookie kan hjälpa
              webbsidans leverantör att känna igen din enhet nästa gång du besöker webbsidan, ge dig
              tillgång till vissa funktioner på webbsidan och/eller registrera dina surfmönster.
            </p>
            <p>
              Vi använder både &ldquo;persistent cookies&rdquo; och &ldquo;session cookies&rdquo;.
              Medan persistent cookies kvarstår på din dator under en längre tid tas session cookies
              automatiskt bort när webbläsarfönstret är stängt.
            </p>
          </div>
        </section>

        {/* Kontakt */}
        <section className='border-border border-t pt-4'>
          <p className='text-muted-foreground text-center text-sm'>
            Vid frågor om Praktos behandling av dina personuppgifter, vänligen kontakta{' '}
            <a href='mailto:info@prakto.se' className='text-primary hover:underline'>
              info@prakto.se
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
