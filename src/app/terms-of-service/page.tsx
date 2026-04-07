import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Användarvillkor - Prakto',
  robots: {
    index: false
  }
};

export default function TermsOfServicePage() {
  return (
    <div className='min-h-screen px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl space-y-8'>
        {/* Main Heading */}
        <div className='text-center'>
          <h1 className='text-foreground text-3xl font-bold'>Användarvillkor för Prakto</h1>
          <p className='text-muted-foreground mt-2 text-sm'>Välkommen till prakto.se</p>
        </div>

        {/* Introduction */}
        <section>
          <p className='text-muted-foreground text-base leading-relaxed'>
            Följande villkor gäller för denna webbplats (&ldquo;Webbplatsen&rdquo;) som ägs av
            Prakto Sverige AB (&ldquo;Prakto&rdquo;). Genom att besöka och använda Webbplatsen
            accepterar du följande villkor:
          </p>
        </section>

        {/* Information */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Information på Webbplatsen</h2>
          <div className='text-muted-foreground space-y-4 text-base leading-relaxed'>
            <p>
              Innehållet på Prakto Webbplats tillhandahålls i befintlig form. Prakto strävar efter
              att tillhandahålla riktig, komplett och uppdaterad information, men garanterar inte
              att till exempel skrivfel, yttre påverkan eller tekniska fel kan resultera i
              felaktigheter. Prakto garanterar inte korrekthet, exakthet, tillförlitlighet eller
              annat beträffande Webbplatsens innehåll.
            </p>
            <p>
              Prakto strävar efter att hålla denna Webbplats fri från datavirus och andra
              företeelser som kan förorsaka användarna av Webbplatsen skada. Prakto vill göra dig
              uppmärksam på att Internetanvändning aldrig är fullständigt säker och alltid innebär
              en risk för virus och andra angrepp. Prakto uppmanar dig därför att vidtaga alla
              nödvändiga försiktighetsåtgärder vid användning av Webbplatsen.
            </p>
            <p>
              Informationen på denna Webbplats kan komma att ändras när som helst, till exempel för
              att iaktta gällande lagstiftning, författning eller branschkod. Ändring av
              användarvillkoren ska anses bindande så snart de har publicerats. Prakto rekommenderar
              därför att du läser igenom dessa användarvillkor varje gång du besöker Praktos
              Webbplats.
            </p>
            <p>
              Prakto är i inget fall ersättningsskyldigt för skador, vilka de än kan vara och utan
              undantag, vare sig för utebliven vinst, avbruten näringsverksamhet eller förlust av
              information, beroende på användning av eller oförmåga att använda Webbplatsen eller
              den information som återges där.
            </p>
          </div>
        </section>

        {/* Immateriella rättigheter */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Immateriella rättigheter</h2>
          <div className='text-muted-foreground space-y-4 text-base leading-relaxed'>
            <p>
              Innehållet på den här Webbplatsen omfattas av immaterialrättsligt skydd genom till
              exempel upphovs- varumärkes- och firmarätt, och tillhör Prakto eller andra
              rättighetsinnehavare. Användare av denna Webbplats har inte rätt att utnyttja
              Webbplatsens innehåll kommersiellt genom förfaranden såsom men inte begränsat till
              återskapande, publicering och överföring, såvida inte Prakto lämnat sitt medgivande
              därtill. Innehållet får emellertid återges, lagras och laddas ned för privat bruk,
              förutsatt att de ekonomiska och ideella rättigheterna till materialet respekteras och
              bibehålls.
            </p>
            <p>
              Det ovanstående gäller inte för information som presenteras under rubriken
              &ldquo;Pressmeddelanden&rdquo;. Denna information får återges även i kommersiella
              sammanhang.
            </p>
            <p>
              All användning av Praktos kännetecken i näringsverksamhet (såsom i annonsering och
              marknadsföring) förutsätter Praktos medgivande därtill.
            </p>
          </div>
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
              tillgång till vissa funktioner på webbsidan och/eller registrera dina surfmönster. Det
              finns annan teknik som pixel-taggar, webbuggar, webblagring och andra liknande filer
              och teknologi som kan ha samma funktioner som cookies. Vi använder termen
              &ldquo;cookies&rdquo; för cookies och all sådan liknande teknologi.
            </p>
            <p>
              Vi använder både &ldquo;persistent cookies&rdquo; och &ldquo;session cookies&rdquo;.
              Medan persistent cookies kvarstår på din dator under en längre tid tas session cookies
              automatiskt bort när webbläsarfönstret är stängt.
            </p>
          </div>
        </section>

        {/* Länkar */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Länkar</h2>
          <div className='text-muted-foreground space-y-4 text-base leading-relaxed'>
            <p>
              Webbplatsen kan innehålla länkar till andra webbplatser som inte står under Praktos
              kontroll. Vi ansvarar inte för integritetsskydd eller innehåll på dessa webbplatser
              utan tillhandahåller länkarna för att underlätta för Praktos besökare att hitta mer
              information inom specifika områden.
            </p>
            <p>
              Om du länkar till Webbplatsen, vill Prakto be dig att länka till Webbplatsens
              förstasida. När länkning sker ska allt material från Webbplatsen öppnas i ett eget
              fönster och ska inte presenteras i samband med varumärke eller logotyp från annan
              webbplats.
            </p>
          </div>
        </section>

        {/* Personuppgiftsansvarig */}
        <section>
          <h2 className='text-foreground mb-3 text-xl font-semibold'>Personuppgiftsansvarig</h2>
          <div className='text-muted-foreground space-y-2 text-base leading-relaxed'>
            <p>Personuppgiftsansvarig för behandlingen av dina personuppgifter är:</p>
            <div className='mt-2'>
              <p className='font-medium'>Prakto Sverige AB</p>
              <p>Org nr: 556597-9878</p>
              <p>Karlslundsvägen 8</p>
              <p>177 44 Järfälla</p>
            </div>
            <p className='mt-4'>
              Vid frågor om Praktos behandling av dina personuppgifter, vänligen kontakta{' '}
              <a href='mailto:info@prakto.se' className='text-primary hover:underline'>
                info@prakto.se
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
