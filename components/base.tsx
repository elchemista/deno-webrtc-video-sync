import {FC, Helmet, n} from "../deps.ts";


const Base: FC = ({children}) => {
    return (
        <>
            <Helmet>
                <html class="dark" lang="en-US" />
                <meta charSet="utf-8" />
                <link rel="stylesheet" href="/assets/style.css" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>RINA Movie</title>
                <script src="https://unpkg.com/simple-peer@9.11.1/simplepeer.min.js"></script>
                <meta name="author" content="Elchemista" />
                <meta name="description" content="Simple webRTC with Deno native websocket" />

            </Helmet>
                <div className="w-full h-screen bg-gray-800" id="app">
                {children}
            </div>
        </>
    );
};

export default Base;
