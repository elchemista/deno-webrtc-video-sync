import { FC, Helmet, n } from "../deps.ts";
import Base from "./base.tsx";

const Meet: FC<{ isDev: boolean }> = ({ isDev }) => {
  return (
    <Base>
     <Helmet footer>
        {isDev && <script>{`window.__DEV__ = true`}</script>}
        <script defer src={"/assets/meet.js"}></script>
      </Helmet>
      <video id="videoPlayer" class="w-screen h-screen z-0" controls>
            <source src="https://videohostingredo.s3.eu-central-1.amazonaws.com/video/%D0%98%D1%81%D1%87%D0%B5%D0%B7%D0%BD%D1%83%D0%B2%D1%88%D0%B0%D1%8F.mp4" type="video/mp4"></source>
        Your browser does not support the video tag.
      </video>

      <nav class="absolute w-full top-0 z-20">
        <div class="max-w-screen-xl justify-between mx-auto p-4">
        <div class="flex md:w-auto md:order-1" id="navbar-cta">
          <ul class="opacity-50 hover:opacity-100 flex flex-col font-medium p-2 mt-2 md:p-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            <li>
            <a type="button" id="vidButton" onclick="toggleVid()" data-tooltip-target="tooltip-share" data-tooltip-placement="left" class="block py-1 px-1 md:p-0 text-white rounded md:bg-transparent md:text-blue-700 md:dark:text-blue-500">
              <svg class="w-6 h-6 text-red-800 dark:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            </a>
            </li>
            <li>
            <a id="muteButton" type="button" onclick="toggleMute()" data-tooltip-target="tooltip-share" data-tooltip-placement="left" class="block py-1 px-1 md:p-0 text-white rounded md:bg-transparent md:text-blue-700 md:dark:text-blue-500">
              <svg class="w-6 h-6 text-red-800 dark:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
            </a>
            </li>
            <li>
            <a type="button" onclick="inviteFriend()" data-tooltip-target="tooltip-share" data-tooltip-placement="left" class="block py-1 px-1 md:p-0 text-white rounded md:bg-transparent md:text-blue-700 md:dark:text-blue-500">
            <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M9 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4H7Zm8-1c0-.6.4-1 1-1h1v-1a1 1 0 1 1 2 0v1h1a1 1 0 1 1 0 2h-1v1a1 1 0 1 1-2 0v-1h-1a1 1 0 0 1-1-1Z" clip-rule="evenodd"/>
            </svg>
            </a>
            </li>
            <li>
            <a type="button" onclick="openChat()" data-tooltip-target="tooltip-share" data-tooltip-placement="left" class="block py-1 px-1 md:p-0 text-white rounded md:bg-transparent md:text-blue-700 md:dark:text-blue-500">
            <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M4 3a1 1 0 0 0-1 1v8c0 .6.4 1 1 1h1v2a1 1 0 0 0 1.7.7L9.4 13H15c.6 0 1-.4 1-1V4c0-.6-.4-1-1-1H4Z" clip-rule="evenodd"/>
              <path fill-rule="evenodd" d="M8 17.2h.1l2.1-2.2H15a3 3 0 0 0 3-3V8h2c.6 0 1 .4 1 1v8c0 .6-.4 1-1 1h-1v2a1 1 0 0 1-1.7.7L14.6 18H9a1 1 0 0 1-1-.8Z" clip-rule="evenodd"/>
            </svg>
            </a>
            </li>
            <li>
            <a type="button" onclick="logout()" data-tooltip-target="tooltip-share" data-tooltip-placement="left" class="block py-1 px-1 md:p-0 text-white rounded md:bg-transparent md:text-blue-700 md:dark:text-blue-500">
            <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2"/>
            </svg>
            </a>
            </li>
          </ul>
        </div>
  
        </div>
      </nav>
      
      <div id="meet" className="z-10 absolute top-0 right-4 m-2">
        <div className="row w-full h-full" id="videos">
          <div class="container">
            <video id="localVideo" class="rounded" autoplay muted></video>
          </div>
        </div>

        <div class="chat-container fixed bottom-16 right-4 w-96" id="chatbox" style={{ display: "none" }}>
        <div class="bg-white border-2 drop-shadow-lg shadow-lg rounded-lg max-w-lg w-full">
          <button type="button" onclick="closeChat()">
          <svg class="w-6 h-6 m-2 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm7.7-3.7a1 1 0 0 0-1.4 1.4l2.3 2.3-2.3 2.3a1 1 0 1 0 1.4 1.4l2.3-2.3 2.3 2.3a1 1 0 0 0 1.4-1.4L13.4 12l2.3-2.3a1 1 0 0 0-1.4-1.4L12 10.6 9.7 8.3Z" clip-rule="evenodd"/>
          </svg>
          </button>
          <div class="chat-inner p-4 h-80 overflow-y-auto" id="chatMessage">
          </div>
          <form class="p-4 border-t flex" style={{ position: "absolute", bottom: 10 }} id="chatForm">
            <input
              type="text"
              placeholder="Type a message"
              id="chatInput"
              class="my-input-chat w-full px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input type="submit" class="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition duration-300" value="Send" />
          </form>
        </div>
        </div>
      </div>
     
    </Base>
  );
};

export default Meet;


        {/* <div className="settings" id="settings" style={{ display: "none" }}>
          <button id="switchButton" className="button" onclick="switchMedia()">
            Switch Camera
          </button>
          <button id="muteButton" class="button" onclick="toggleMute()">
            Unmuted
          </button>
          <button id="vidButton" class="button" onclick="toggleVid()">
            Video Enabled
          </button>
          <button class="button" onclick="shareScreen()">
            Share Screen
          </button>
          <button class="button" onclick="inviteFriend()">
            Invite Friend
          </button>
          <button class="button" onclick="openChat()">
            Chat
          </button>
          <button class="button" onclick="logout()">
            Logout
          </button>
        </div> */}