import { get } from "svelte/store"
import { MAIN, OUTPUT, STORE } from "../../types/Channels"
import { menuClick } from "../components/context/menuClick"
import { history } from "../components/helpers/history"
import { loadShows } from "../components/helpers/setShow"
import { checkName } from "../components/helpers/show"
import { convertBebliaBible } from "../converters/bebliaBible"
import { convertEasyWorship } from "../converters/easyworship"
import { convertOpenLP } from "../converters/openlp"
import { convertOpenSong, convertOpenSongBible } from "../converters/opensong"
import { convertPDF } from "../converters/pdf"
import { convertPowerpoint } from "../converters/powerpoint"
import { convertProPresenter } from "../converters/propresenter"
import { convertTexts } from "../converters/txt"
import { convertVideopsalm } from "../converters/videopsalm"
import { convertZefaniaBible } from "../converters/zefaniaBible"
import {
  activePopup,
  activeShow,
  activeTimers,
  alertMessage,
  autoOutput,
  backgroundColor,
  currentWindow,
  displayMetadata,
  draw,
  drawSettings,
  drawTool,
  events,
  exportPath,
  folders,
  media,
  mediaCache,
  mediaFolders,
  os,
  outBackground,
  outOverlays,
  outputDisplay,
  outputPosition,
  outputScreen,
  outSlide,
  overlays,
  playerVideos,
  projects,
  saved,
  screen,
  shows,
  showsCache,
  showsPath,
  stageShows,
  templates,
  themes,
  transitionData,
  version,
} from "../stores"
import { IMPORT } from "./../../types/Channels"
import { checkForUpdates } from "./checkForUpdates"
import { createData } from "./createData"
import { setLanguage } from "./language"
import { listen } from "./messages"
import { receive, send } from "./request"
import { updateSettings } from "./updateSettings"

export function startup() {
  if (!get(currentWindow)) {
    send(MAIN, ["OUTPUT", "DISPLAY", "VERSION"])
    send(STORE, ["SHOWS", "STAGE_SHOWS", "PROJECTS", "OVERLAYS", "TEMPLATES", "EVENTS", "MEDIA", "THEMES", "CACHE", "SETTINGS"])
  }

  receive(MAIN, receiveMAIN)
  receive(STORE, receiveSTORE)
  receive(OUTPUT, receiveOUTPUT)
  receive(IMPORT, receiveIMPORT)
  // receive(OUTPUT, get(currentWindow) ? receiveOUTPUTasOutput : receiveOUTPUT)
  // window.api.receive(OUTPUT, (msg: any) => {
  //   if (!get(currentWindow) || ["DISPLAY"].includes(msg.channel)) {
  //     if (receiveOUTPUT[msg.channel]) receiveMAIN[msg.channel](msg.data)
  //   }
  // })

  setLanguage()
  loadShows(Object.keys(get(shows)))
  // search (cache search text?...)

  // output
  // if (get(autoOutput)) {
  //   send(OUTPUT, ["DISPLAY"], { enabled: true, screen: get(outputScreen) })
  // }

  // load new show on show change
  activeShow.subscribe((a) => {
    if (a && (a.type === undefined || a.type === "show")) loadShows([a.id])
  })
}

// receivers

const receiveMAIN: any = {
  GET_OS: (a: any) => os.set(a),
  VERSION: (a: any) => {
    version.set(a)
    checkForUpdates(a)
  },
  DISPLAY: (a: any) => outputDisplay.set(a),
  GET_PATHS: (a: any) => createData(a),
  MENU: (a: any) => menuClick(a),
  SHOWS_PATH: (a: any) => showsPath.set(a),
  EXPORT_PATH: (a: any) => exportPath.set(a),
  ALERT: (a: any) => {
    alertMessage.set(a)
    activePopup.set("alert")
  },
  CLOSE: () => {
    if (get(saved)) window.api.send(MAIN, { channel: "CLOSE" })
    else activePopup.set("unsaved")
  },
  OUTPUT: (a: any) => {
    if (a === "true") currentWindow.set("output")
    else if (a === "pdf") currentWindow.set("pdf")
    else listen()
  },
}

const receiveSTORE: any = {
  SETTINGS: (a: any) => updateSettings(a),
  SHOWS: (a: any) => shows.set(a),
  STAGE_SHOWS: (a: any) => stageShows.set(a),
  PROJECTS: (a: any) => {
    projects.set(a.projects)
    folders.set(a.folders)
  },
  OVERLAYS: (a: any) => overlays.set(a),
  TEMPLATES: (a: any) => templates.set(a),
  EVENTS: (a: any) => events.set(a),
  MEDIA: (a: any) => media.set(a),
  THEMES: (a: any) => themes.set(a),
  CACHE: (a: any) => mediaCache.set(a.media || {}),
}

const receiveOUTPUT: any = {
  BACKGROUND: (a: any) => outBackground.set(a),
  TRANSITION: (a: any) => transitionData.set(a),
  SLIDE: (a: any) => outSlide.set(a),
  OVERLAYS: (a: any) => outOverlays.set(a),
  OVERLAY: (a: any) => overlays.set(a),
  META: (a: any) => displayMetadata.set(a),
  COLOR: (a: any) => backgroundColor.set(a),
  SCREEN: (a: any) => screen.set(a),
  SHOWS: (a: any) => showsCache.set(a),
  DRAW: (a: any) => draw.set(a),
  DRAW_TOOL: (a: any) => drawTool.set(a),
  DRAW_SETTINGS: (a: any) => drawSettings.set(a),
  MEDIA: (a: any) => mediaFolders.set(a),
  ACTIVE_TIMERS: (a: any) => activeTimers.set(a),
  DISPLAY: (a: any) => outputDisplay.set(a.enabled),
  POSITION: (a: any) => outputPosition.set(a),
  PLAYER_VIDEOS: (a: any) => playerVideos.set(a),
  SCREEN_ADDED: (a: any) => {
    if (get(autoOutput) && !get(outputDisplay)) {
      send(OUTPUT, ["DISPLAY"], { enabled: true, screen: a })
      outputScreen.set(a)
    }
  },
}

// const receiveOUTPUTasOutput: any = {
//   DISPLAY: receiveOUTPUT.DISPLAY,
// }

const receiveIMPORT: any = {
  txt: (a: any) => convertTexts(a),
  pdf: (a: any) => convertPDF(a),
  powerpoint: (a: any) => convertPowerpoint(a),
  freeshow: (a: any) => importShow(a),
  easyworship: (a: any) => convertEasyWorship(a),
  beblia_bible: (a: any) => convertBebliaBible(a),
  zefania_bible: (a: any) => convertZefaniaBible(a),
  opensong_bible: (a: any) => convertOpenSongBible(a),
  videopsalm: (a: any) => convertVideopsalm(a),
  openlp: (a: any) => convertOpenLP(a),
  opensong: (a: any) => convertOpenSong(a),
  propresenter: (a: any) => convertProPresenter(a),
}

function importShow(files: any[]) {
  let duplicates: string[] = []
  files.forEach(({ content }: any) => {
    let [id, show] = JSON.parse(content)

    // if exits
    if (get(shows)[id]) duplicates.push(show.name)
    else show.name = checkName(show.name)

    history({ id: "newShow", newData: { id, show } })
  })

  // TODO: override or skip
  if (duplicates.length) {
    alertMessage.set("Overriten some shows:<br>- " + duplicates.join("<br>- "))
    activePopup.set("alert")
  }
}
