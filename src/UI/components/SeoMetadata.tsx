const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Showcord',
    applicationCategory: 'CommunicationApplication',
    operatingSystem: 'Web',
    url: 'https://showcord.com/',
    description:
        'Showcord is a modern Pokemon Showdown client for battles, room chat, and private messages.',
    image: 'https://showcord.com/assets/pokeball_galaxy.png',
    author: {
        '@type': 'Organization',
        name: 'Showcord',
    },
};

export function SeoMetadata() {
    return (
        <>
            <title>Showcord | Pokemon Showdown Client for Battles and Chat</title>
            <meta
                name="description"
                content="Showcord is a modern Pokemon Showdown client. Join battles, chat rooms, and private messages with a streamlined interface."
            />
            <meta
                name="robots"
                content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
            />
            <link rel="canonical" href="https://showcord.com/" />

            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="Showcord" />
            <meta property="og:url" content="https://showcord.com/" />
            <meta property="og:title" content="Showcord | Pokemon Showdown Client for Battles and Chat" />
            <meta
                property="og:description"
                content="Showcord is a modern Pokemon Showdown client. Join battles, chat rooms, and private messages with a streamlined interface."
            />
            <meta property="og:image" content="https://showcord.com/assets/pokeball_galaxy.png" />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content="https://showcord.com/" />
            <meta name="twitter:title" content="Showcord | Pokemon Showdown Client for Battles and Chat" />
            <meta
                name="twitter:description"
                content="Showcord is a modern Pokemon Showdown client. Join battles, chat rooms, and private messages with a streamlined interface."
            />
            <meta name="twitter:image" content="https://showcord.com/assets/pokeball_galaxy.png" />

            <script type="application/ld+json">{JSON.stringify(softwareApplicationSchema)}</script>
        </>
    );
}
