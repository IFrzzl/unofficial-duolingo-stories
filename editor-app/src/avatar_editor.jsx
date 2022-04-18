import React, {useState} from 'react';
import {useDataFetcher2, useInput} from './hooks'
import {Spinner, SpinnerBlue} from './react/spinner'
import {Flag} from './react/flag'
import {getAvatars, getLanguageName, getSpeakers, setAvatarSpeaker} from "./api_calls.mjs";
import "./avatar_editor.css"
import {fetch_post} from "./includes.mjs";

function Avatar(props) {
    let avatar = props.avatar;
    let [inputName, inputNameSetValue] = useInput(avatar.name || "");
    let [inputSpeaker, inputSpeakerSetValue] = useInput(avatar.speaker || "");
    let language_id = props.language_id;
    function save() {
        let data = {
            name: inputName,
            speaker: inputSpeaker,
            language_id: language_id,
            avatar_id: avatar.avatar_id,
        };
        return setAvatarSpeaker(data)
    }
    if(avatar.avatar_id === -1) {
        return <div className={"avatar"}>
            <p>{avatar.avatar_id}</p>
            <p style={{height: "50px"}}>
                <img alt="avatar" src={avatar.link} style={{height: "50px"}}/>
            </p>

            <p>{inputName}</p>
            <p><input value={inputSpeaker} onChange={inputSpeakerSetValue} type="text" placeholder="Speaker"/></p>
            <span className="copy_button" title="play audio" onClick={(e) => props.play(e, inputSpeaker, "Duo")}><img alt="play" src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"/></span>
            <p><input value="save" onClick={save} disabled={!!(inputName && inputName === avatar.name && inputSpeaker && inputSpeaker === avatar.speaker)} type="button"/></p>
        </div>
    }
    return <div className={"avatar"}>
        <p>{avatar.avatar_id}</p>
        <p>
            <img alt="avatar" src={avatar.link} style={{height: "50px"}}/>
        </p>

        <p><input value={inputName} disabled={avatar.avatar_id === 0} onChange={inputNameSetValue} type="text" placeholder="Name"/></p>
        <p><input value={inputSpeaker} onChange={inputSpeakerSetValue} type="text" placeholder="Speaker"/></p>

        <PlayButton play={props.play} speaker={inputSpeaker} name={avatar.avatar_id === 0 ? "Duo" : inputName} />
        <p><input value="save" onClick={save} disabled={!!(inputName && inputName === avatar.name && inputSpeaker && inputSpeaker === avatar.speaker)} type="button"/></p>
    </div>
}

function AvatarEditorHeader() {
    let urlParams = new URLSearchParams(window.location.search);
    const [language, ] = React.useState(parseInt(urlParams.get("language")) || undefined);
    const [language_data, ] = useDataFetcher2(getLanguageName, [language]);

    if(language_data === undefined)
        return <></>
    return <div className="AvatarEditorHeader">
        <b>Character-Editor</b>
        <Flag flag={language_data.flag} flag_file={language_data.flag_file}/>
        <span className={"AvatarEditorHeaderFlagName"}>{language_data.name}</span>
    </div>
}

export function AvatarMain() {
    return <>
        <div id="toolbar">
            <AvatarEditorHeader />
        </div>
        <div id="root">
            <AvatarNames />
        </div>
    </>
}

function copyText(e, text) {
    e.preventDefault();
    return navigator.clipboard.writeText(text);
}

function PlayButton(props) {
    let play = props.play;
    let speaker = props.speaker;
    let name = props.name;

    let [loading, setLoading] = useState(0);

    async function do_play(e, text, name) {
        e.preventDefault();
        setLoading(1);
        try {
            await play(e, text, name);
        }
        catch (e) {
            console.log(e);
            return setLoading(-1);
        }
        setLoading(0);
    }

    return <span className="play_button" title="play audio" onClick={(e) => do_play(e, speaker, name)}>
                {loading === 0 ? <img alt="play" src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"/> :
                 loading === 1 ? <SpinnerBlue /> :
                 loading ===-1 ? <img title="an error occurred" alt="error" src="icons/error.svg"/> : <></>}
            </span>
}

function SpeakerEntry(props) {
    let speaker = props.speaker;

    return <tr>
        <td>
            <PlayButton play={props.play} speaker={speaker.speaker} name="Duo" />
            <span className="ssml_speaker">{speaker.speaker}</span>
            <span className="copy_button" title="copy to clipboard" onClick={(e) => copyText(e, speaker.speaker)}><img alt="copy" src="icons/copy.svg"/></span>
        </td>
        <td>{speaker.gender}</td>
        <td>{speaker.type}</td>
    </tr>
}

function AvatarNames() {
    let urlParams = new URLSearchParams(window.location.search);
    const [language, ] = React.useState(parseInt(urlParams.get("language")) || undefined);
    const [avatars, ] = useDataFetcher2(getAvatars, [language]);
    const [speakers, ] = useDataFetcher2(getSpeakers, [language]);
    const [language_data, ] = useDataFetcher2(getLanguageName, [language]);
    let [speakText, setSpeakText] = useState("");
    const [stored, setStored] = useState({});

    if(speakText === "")
        speakText = language_data?.default_text || "My name is $name.";

    function doSetSpeakText(event) {
        setStored({})
        setSpeakText(event.target.value);
    }

    let images = [];
    let avatars_new = [];
    let avatars_new_important = [];
    if(avatars !== undefined)
    for(let avatar of avatars) {
        if(images.indexOf(avatar.link) === -1) {
            if([0, 414, 415, 416, 418, 507, 508, 509, 592, 593].indexOf(avatar.avatar_id) !== -1)
                avatars_new_important.push(avatar);
            else
                avatars_new.push(avatar);
            images.push(avatar.link)
        }
    }

    async function play(e, text, name) {
        if(stored[text] === undefined) {
            let response2 = await fetch_post(`https://carex.uber.space/stories/audio/set_audio2.php`,
                {"id": 0, "speaker": text, "text": speakText.replace("$name", name)});
            let ssml_response = await response2.json();
            stored[text] = new Audio("https://carex.uber.space/stories/audio/" + ssml_response["output_file"]);
            setStored(stored);
        }
        let audio = stored[text];
        audio.play();


        e.preventDefault();
    }

    if(avatars === undefined || speakers === undefined || language === undefined)
        return <Spinner/>
    return <>
    <div className="speaker_list">
        <div>
            <textarea value={speakText} onChange={doSetSpeakText} style={{width: "100%"}}/>
        </div>
        <table id="story_list" className="js-sort-table js-sort-5 js-sort-desc" data-js-sort-table="true">
            <thead>
            <tr>
                <th style={{borderRadius: "10px 0 0 0"}} data-js-sort-colnum="0">Name</th>
                <th data-js-sort-colnum="1">Gender</th>
                <th style={{borderRadius: "0 10px 0 0"}} data-js-sort-colnum="2">Type</th>
            </tr>
            </thead>
            <tbody>
            {speakers.map((speaker, index) =>
                <SpeakerEntry key={index} speaker={speaker} play={play} />
            )}
            </tbody>
        </table>
    </div>
    <div className={"avatar_editor"} style={{"overflowY": "scroll"}}>
        <p>These characters are the default cast of duolingo. Their names should be kept as close to the original as possible.</p>
        <div className={"avatar_editor_group"}>
        {avatars_new_important.map((avatar, index) =>
            <Avatar key={index} play={play} language_id={language} avatar={avatar} />
        )}
        </div>
        <p>These characters just appear in a couple of stories.</p>
        <div className={"avatar_editor_group"}>
        {avatars_new.map((avatar, index) =>
            <Avatar key={index} play={play} language_id={language} avatar={avatar} />
        )}
        </div>
    </div>
    </>
}

