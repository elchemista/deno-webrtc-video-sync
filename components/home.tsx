import {FC, Helmet, n} from "../deps.ts";
import Base from "./base.tsx";

const Home: FC = () => {
    return (
        <Base>
            <Helmet footer>
                <footer class="h-full inset-x-0 bottom-0 shadow sm:flex sm:items-center sm:justify-between p-4 sm:p-6 xl:p-8 bg-gray-800 antialiased">
                    <p class="mb-4 text-sm text-center text-gray-500 dark:text-gray-400 sm:mb-0">
                        &copy; 2024
                        <a href="https://github.com/feross/simple-peer" class="hover:underline" target="_blank">I LOVE YOU RINA</a>. All rights reserved.
                    </p>
                    <div class="flex justify-center items-center space-x-1">
                        <a href="#" data-tooltip-target="tooltip-github" class="inline-flex justify-center p-2 text-gray-500 rounded-lg cursor-pointer dark:text-gray-400 dark:hover:text-white hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-600">
                            <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 .333A9.911 9.911 0 0 0 6.866 19.65c.5.092.678-.215.678-.477 0-.237-.01-1.017-.014-1.845-2.757.6-3.338-1.169-3.338-1.169a2.627 2.627 0 0 0-1.1-1.451c-.9-.615.07-.6.07-.6a2.084 2.084 0 0 1 1.518 1.021 2.11 2.11 0 0 0 2.884.823c.044-.503.268-.973.63-1.325-2.2-.25-4.516-1.1-4.516-4.9A3.832 3.832 0 0 1 4.7 7.068a3.56 3.56 0 0 1 .095-2.623s.832-.266 2.726 1.016a9.409 9.409 0 0 1 4.962 0c1.89-1.282 2.717-1.016 2.717-1.016.366.83.402 1.768.1 2.623a3.827 3.827 0 0 1 1.02 2.659c0 3.807-2.319 4.644-4.525 4.889a2.366 2.366 0 0 1 .673 1.834c0 1.326-.012 2.394-.012 2.72 0 .263.18.572.681.475A9.911 9.911 0 0 0 10 .333Z" clip-rule="evenodd"/>
                            </svg>
                            <span class="sr-only">Github</span>
                        </a>
                        <div id="tooltip-github" role="tooltip" class="inline-block absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 transition-opacity duration-300 tooltip dark:bg-gray-700">
                            Star us on GitHub
                            <div class="tooltip-arrow" data-popper-arrow></div>
                        </div>
                    </div>
                </footer>
                <script src={"/assets/home.js"}></script>
            </Helmet>

            <section id="home" class="bg-gray-900">
                    <div class="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
                        <div class="mr-auto place-self-center lg:col-span-7">
                            <h1 class="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">Movie Sync: Watch Together, Wherever</h1>
                            <p class="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">Enjoy movies with friends or your significant other in perfect sync – anytime, anywhere.</p>
                        <form id="form" class="flex flex-col space-y-8">
                        <div class="flex flex-col gap-y-8 h-12 space-x-2 w-auto">
                        <input
                            title="Can't use special character"
                            class="bg-transparent border-2 rounded-full py-4 px-6 text-[16px] leading-[22.4px] font-light placeholder:text-white text-white"
                            type="text"
                            id="room"
                            placeholder="Room (no special char)"
                            pattern="^[a-zA-Z0-9]+$"
                            required
                            />
                        </div>
                        <div class="flex flex-col gap-y-8 h-12 space-x-2 w-auto">
                            <input
                            class="bg-transparent border-2 rounded-full py-4 px-6 text-[16px] leading-[22.4px] font-light placeholder:text-white text-white"
                            type="text"
                            id="username"
                            placeholder="Name"
                            required
                            />
                        </div>
                            <button type="submit" class="max-w-[200px] h-auto rounded-full bg-white text-black py-3 px-6">
                                <span class="text-teal-900 font-semibold">Create Room</span>
                            </button>
                        </form>
                        </div>
                        <div class="hidden lg:mt-0 lg:col-span-5 lg:flex">
                            <img class="rounded-2xl" src="/assets/img/hero.jpg" alt="mockup"></img>
                        </div>
                    </div>
            </section>

        </Base>
    );
};

export default Home;
