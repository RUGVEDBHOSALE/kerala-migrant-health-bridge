import { useState, useRef } from 'react'

export default function VoiceRecorder({ onRecordingComplete }) {
    const [isRecording, setIsRecording] = useState(false)
    const [audioUrl, setAudioUrl] = useState(null)
    const [transcript, setTranscript] = useState('')
    const [isTranscribing, setIsTranscribing] = useState(false)

    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])
    const recognitionRef = useRef(null)

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            // Setup MediaRecorder for audio file
            mediaRecorderRef.current = new MediaRecorder(stream)
            audioChunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data)
            }

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                const url = URL.createObjectURL(audioBlob)
                setAudioUrl(url)

                if (onRecordingComplete) {
                    onRecordingComplete({ audioBlob, audioUrl: url, transcript })
                }

                stream.getTracks().forEach(track => track.stop())
            }

            // Setup Web Speech API for transcription
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
                recognitionRef.current = new SpeechRecognition()
                recognitionRef.current.continuous = true
                recognitionRef.current.interimResults = true
                recognitionRef.current.lang = 'en-IN'

                let finalTranscript = ''

                recognitionRef.current.onresult = (event) => {
                    let interimTranscript = ''
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript + ' '
                        } else {
                            interimTranscript += event.results[i][0].transcript
                        }
                    }
                    setTranscript(finalTranscript + interimTranscript)
                }

                recognitionRef.current.onerror = (event) => {
                    console.log('Speech recognition error:', event.error)
                }

                recognitionRef.current.start()
                setIsTranscribing(true)
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)
        } catch (error) {
            console.error('Error starting recording:', error)
            alert('Could not access microphone. Please check permissions.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop()
            setIsTranscribing(false)
        }
    }

    const clearRecording = () => {
        setAudioUrl(null)
        setTranscript('')
        if (onRecordingComplete) {
            onRecordingComplete(null)
        }
    }

    return (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white/80">🎤 Voice Note</h4>
                <span className="text-xs text-white/50">
                    {isTranscribing ? '(Speech-to-text active)' : ''}
                </span>
            </div>

            {/* Recording Controls */}
            <div className="flex items-center gap-3 mb-4">
                {!isRecording ? (
                    <button
                        type="button"
                        onClick={startRecording}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium hover:from-red-600 hover:to-rose-700 transition-all"
                    >
                        <span className="w-3 h-3 rounded-full bg-white"></span>
                        Start Recording
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium hover:from-gray-700 hover:to-gray-800 transition-all"
                    >
                        <span className="w-3 h-3 rounded bg-white"></span>
                        Stop Recording
                    </button>
                )}

                {audioUrl && (
                    <button
                        type="button"
                        onClick={clearRecording}
                        className="text-white/60 hover:text-white text-sm"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Recording Animation */}
            {isRecording && (
                <div className="flex items-center justify-center gap-1 py-4">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="voice-wave-bar w-1 bg-gradient-to-t from-red-500 to-rose-400 rounded-full"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        ></div>
                    ))}
                    <span className="ml-3 text-red-400 text-sm live-indicator">● Recording...</span>
                </div>
            )}

            {/* Transcript */}
            {transcript && (
                <div className="mt-3">
                    <p className="text-xs text-white/50 mb-1">Transcript:</p>
                    <p className="text-sm text-white/80 bg-white/5 rounded-lg p-3">
                        {transcript}
                    </p>
                </div>
            )}

            {/* Audio Playback */}
            {audioUrl && (
                <div className="mt-3">
                    <audio controls className="w-full h-10" src={audioUrl}>
                        Your browser does not support audio playback.
                    </audio>
                </div>
            )}

            <p className="text-xs text-white/40 mt-3">
                💡 Record a voice message to help workers with low literacy understand their prescription
            </p>
        </div>
    )
}
