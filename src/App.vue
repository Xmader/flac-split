
<template>
    <main>

        <md-whiteframe md-elevation="3">
            <md-toolbar>

                <h2
                    class="md-title"
                    style="flex: 1"
                >
                    Flac Split
                </h2>

            </md-toolbar>
        </md-whiteframe>

        <xm-container>

            <xm-blank></xm-blank>

            <md-table-card>

                <md-toolbar>
                    <h1 class="md-title">{{ title || "Open a .cue File…" }}</h1>

                    <md-button
                        class="md-icon-button"
                        @click="selectCueFile"
                    >
                        <svg
                            x="0px"
                            y="0px"
                            width="20px"
                            height="25px"
                            viewBox="0 0 20 20"
                            focusable="false"
                            fill="#000000"
                            style="margin-top: -6px;margin-left: -3px;"
                        >
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"></path>
                            <path d="M8 15.01l1.41 1.41L11 14.84V19h2v-4.16l1.59 1.59L16 15.01 12.01 11z"></path>
                        </svg>
                        <md-tooltip md-direction="top">Open File</md-tooltip>
                    </md-button>

                    <div
                        class="md-file"
                        style="display: none;"
                    >
                        <input
                            type="file"
                            accept=".cue"
                            ref="cue-file-selector"
                            @change="onSelectCueFile"
                        >
                    </div>

                </md-toolbar>

                <md-table-alternate-header md-selected-label="selected">
                    <md-button
                        class="md-icon-button"
                        @click="onSubmit"
                    >
                        <md-icon>check</md-icon>
                    </md-button>
                </md-table-alternate-header>

                <md-table @select="onSelectTracks">

                    <md-table-header>
                        <md-table-row>
                            <md-table-head>
                                Track ID
                            </md-table-head>
                            <md-table-head>
                                Title
                            </md-table-head>
                            <md-table-head>
                                Start Time
                            </md-table-head>
                            <md-table-head>
                                End Time
                            </md-table-head>
                            <md-table-head>
                                Duration (s)
                            </md-table-head>
                        </md-table-row>
                    </md-table-header>

                    <md-table-body>
                        <md-table-row
                            v-for="(row, rowIndex) in trackInfoList"
                            :key="rowIndex"
                            :md-item="row"
                            md-selection
                        >
                            <md-table-cell
                                v-for="(column, columnIndex) in row"
                                :key="columnIndex"
                            >
                                <span>
                                    {{ column }}
                                </span>
                            </md-table-cell>
                        </md-table-row>
                    </md-table-body>

                </md-table>

            </md-table-card>

            <xm-blank></xm-blank>

        </xm-container>

        <md-dialog
            ref="dialog"
            :md-click-outside-to-close="false"
            :md-esc-to-close="false"
        >

            <template v-if="!progressing">
                <md-dialog-title>Upload a flac file</md-dialog-title>

                <md-dialog-content>
                    <md-input-container>
                        <md-file
                            v-model="flacFileName"
                            @selected="onFlacFileChange"
                            accept="audio/flac"
                            placeholder="choose a flac file…"
                            required
                        ></md-file>
                    </md-input-container>
                </md-dialog-content>

                <md-dialog-actions>
                    <md-button
                        class="md-primary"
                        @click="dialog.close()"
                    >
                        Cancel
                    </md-button>
                    <md-button
                        class="md-primary"
                        @click="onFinalSubmit"
                        :disabled="!flacFileName || !flacFile"
                    >
                        Ok
                    </md-button>
                </md-dialog-actions>
            </template>

            <template v-else>
                <md-dialog-title>Splitting</md-dialog-title>

                <md-dialog-content>
                    <md-progress :md-progress="progress"></md-progress>
                </md-dialog-content>

                <md-dialog-actions v-if="progress >= 100">
                    <md-button
                        class="md-primary"
                        @click="dialog.close()"
                    >
                        Ok
                    </md-button>
                </md-dialog-actions>
            </template>

        </md-dialog>

    </main>
</template>

<script>
// @ts-check

import cueParser from "cue-parser"
import fileSaver from "file-saver"

// @ts-ignore
import xmBlank from "./components/xmBlank.vue"
// @ts-ignore
import xmContainer from "./components/xmContainer.vue"

/**
 * @typedef {Object} TrackInfo
 * @property {string} id
 * @property {string} title
 * @property {string} start
 * @property {string=} end
 * @property {string=} duration
 */

/** 
 * @typedef {import("cue-parser/typings/cuesheet").Time} TimeInfo
 */

export default {
    components: {
        xmBlank,
        xmContainer,
    },
    data() {
        return ({
            classes: {
                active: "md-primary",
            },

            /** @type {string} */
            title: null,

            /** @type {File} */
            cueFile: null,

            // /** @type {import("cue-parser/typings/cuesheet").CueSheet} */
            // cueInfo: null,

            /** @type {TrackInfo[]} */
            trackInfoList: null,

            /** @type {TrackInfo[]} */
            selectedTracks: [],

            /** @type {string} */
            flacFileName: null,

            /** @type {File} */
            flacFile: null,

            progressing: false,

            progress: 0,
        })
    },
    computed: {
        dialog() {
            return this.$refs["dialog"]
        }
    },
    methods: {
        selectCueFile() {
            // @ts-ignore
            this.$refs["cue-file-selector"].click()
        },

        /**
         * @param {Blob} file
         * @returns {Promise<string>}
         */
        readFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onerror = reader.onabort = (e) => {
                    reject(e)
                }
                reader.onload = (e) => {
                    // @ts-ignore
                    resolve(e.target.result)
                }
                reader.readAsText(file)
            })
        },

        /**
         * @param {Blob} file
         * @returns {Promise<Uint8Array>}
         */
        readFileAsUint8Array(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onerror = reader.onabort = (e) => {
                    reject(e)
                }
                reader.onload = (e) => {
                    // @ts-ignore
                    const result = e.target.result
                    resolve(new Uint8Array(result))
                }
                reader.readAsArrayBuffer(file)
            })
        },

        onSelectCueFile(e) {
            /** @type {File[]} */
            const files = [...e.target.files]
            const cueFile = files.find((x) => {
                return x.name.endsWith(".cue")
            })

            this.cueFile = cueFile
            this.parseCueFile(cueFile)
        },

        addZero(str, length = 2) {
            return ("" + str).padStart(length, "0")
        },

        /**
         * ( frame / (75 / 100) -> 0.01 sec )
         * @param {TimeInfo} timeInfo
         */
        getTimeStr(timeInfo) {
            const min = this.addZero(timeInfo.min)
            const sec = this.addZero(timeInfo.sec)
            const hundredthSecond = this.addZero(Math.floor(timeInfo.frame / (75 / 100)))
            return `${min}:${sec}.${hundredthSecond}`
        },

        /**
         * get millisecond
         * @param {TimeInfo} timeInfo
         */
        getMs(timeInfo) {
            const s = timeInfo.min * 60 + timeInfo.sec
            const hs = s * 100 + Math.floor(timeInfo.frame / (75 / 100))
            const ms = hs * 10
            return ms
        },

        /** 
         * get duration (s)
         * @param {TimeInfo} startTimeInfo
         * @param {TimeInfo} endTimeInfo
         */
        getDuration(startTimeInfo, endTimeInfo) {
            const startTimeMs = this.getMs(startTimeInfo)
            const endTimeMs = this.getMs(endTimeInfo)
            const durationMs = endTimeMs - startTimeMs
            return durationMs / 1000
        },

        /**
         * @param {File} file
         */
        async parseCueFile(file) {
            const content = await this.readFile(file)
            const result = cueParser.parse(content)

            // this.cueInfo = result
            this.title = result.title

            if (!result.files || result.files.length == 0) {
                return
            }

            const flacFileInfo = result.files[0]
            const tracks = flacFileInfo.tracks

            /** @type {TrackInfo[]} */
            const trackInfoList = tracks.map((track, index, arr) => {
                const nextTrack = arr[index + 1]

                // strat time 
                const startTimeInfo = track.indexes.find(x => x.number == 1).time  // index 1
                const start = this.getTimeStr(startTimeInfo)

                // end time & duration
                const endTimeInfo = nextTrack && nextTrack.indexes[0].time  // index 0 or index 1 of the next track
                const end = endTimeInfo && this.getTimeStr(endTimeInfo)
                const duration = end && this.getDuration(startTimeInfo, endTimeInfo).toFixed(2).padStart(7, " ")

                return {
                    id: "#" + track.number,
                    title: track.title,
                    start,
                    end: end || "",
                    duration: duration || "",
                }
            })

            this.trackInfoList = JSON.parse(JSON.stringify(trackInfoList))  // deep copy

            // console.log(content)
            // console.log(result)
            // console.log(trackInfoList)

        },

        onSelectTracks(tracks) {
            this.selectedTracks = tracks
            // console.log(this.selectedTracks)
        },

        onSubmit() {
            this.progressing = false
            this.dialog.open()
        },

        onFlacFileChange(files) {
            if (files.length == 0) return
            this.flacFile = files[0]
        },

        onFinalSubmit() {
            this.progressing = true
            this.progress = 0

            const flacFile = this.flacFile
            const selectedTracks = this.selectedTracks

            if (!flacFile || !selectedTracks || selectedTracks.length == 0) {
                return
            }

            const progressIncreasePerFile = 100 / selectedTracks.length

            /** @type {number[]} */
            const progressList = new Array(selectedTracks.length).fill(0)

            const updateProgress = (trackIndex, trackPercent) => {
                progressList[trackIndex] = progressIncreasePerFile * trackPercent
                this.progress = progressList.reduce((p, c) => p + c)
            }

            selectedTracks.forEach(async (track, index) => {

                const outputBlob = await this.splitFlac(
                    flacFile,
                    track.start,
                    track.end,
                    (x) => {
                        // console.log(x)
                        updateProgress(index, x.percent)
                    },
                )

                // console.log(URL.createObjectURL(outputBlob))

                fileSaver.saveAs(outputBlob, track.title + ".flac")

            })
        },

        /**
         * @param {Worker} worker
         * @param {Object} message
         * @param {Function} progressCb
         */
        getWorkerResponse(worker, message, progressCb = () => { }) {
            return new Promise((resolve, reject) => {
                const listener = (e) => {
                    const data = e.data
                    // console.log(data)

                    if (data) {
                        if (data.reply === "err") {
                            reject(data.values[0])
                        } else if (data.reply === "progress") {
                            const [value, total, size] = data.values
                            progressCb({
                                value,
                                total,
                                size,
                                percent: value / total * 100,
                            })
                        } else if (data.reply === "done") {
                            worker.removeEventListener("message", listener)
                            resolve(data.values)
                        }
                    }

                }
                const errorCb = (e) => {
                    worker.removeEventListener("error", errorCb)
                    reject(e)
                }
                worker.addEventListener("message", listener)
                worker.addEventListener("error", errorCb)
                worker.postMessage(message)
            })
        },

        newFlacWorker() {
            const worker = new Worker("./lib/flac.js/" + "EmsWorkerProxy.js")
            return worker
        },

        /**
         * @param {File} flacFile
         * @param {string} start
         * @param {string} end
         * @param {Function} progressCb
         */
        async splitFlac(flacFile, start, end = null, progressCb = () => { }) {
            const inputData = await this.readFileAsUint8Array(flacFile)

            const outFile = "result.flac"
            const inputFile = "input.flac"

            let args = [
                "-o",
                outFile,
                inputFile,
            ]
            if (start != "00:00.00") {
                args.unshift(`--skip=${start}`)
            }
            if (end) {
                args.unshift(`--until=${end}`)
            }

            // console.log(args)

            const message = {
                command: "encode",
                args,
                outData: {
                    [outFile]: {
                        // MIME type
                        "MIME": "audio/flac",
                    },
                },
                fileData: {
                    [inputFile]: inputData,
                },
            }

            const worker = this.newFlacWorker()
            const response = await this.getWorkerResponse(worker, message, progressCb)

            /** @type {Blob} */
            const outputBlob = response[outFile].blob
            // const outputData = await this.readFileAsUint8Array(outputBlob)

            return outputBlob
        }

    },
}
</script>

<style>
    .md-whiteframe {
        z-index: 3;
    }
</style>
