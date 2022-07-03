import React, { useState } from 'react';
import withStyles from "@material-ui/core/styles/withStyles";
import {
    Card, CardContent, FormControl, FormHelperText,
    InputLabel, MenuItem, Select, Typography, Slider
} from "@material-ui/core";
import { callDalleService } from "./backend_api";
import GeneratedImageList from "./GeneratedImageList";
import TextPromptInput from "./TextPromptInput";

import "./App.css";
import BackendUrlInput from "./BackendUrlInput";
import LoadingSpinner from "./LoadingSpinner";
import NotificationCheckbox from './NotificationCheckbox';

const useStyles = () => ({
    root: {
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        margin: '60px 0px 60px 0px',
        alignItems: 'center',
        textAlign: 'center',
    },
    title: {
        marginBottom: '20px',
    },
    playgroundSection: {
        display: 'flex',
        flex: 1,
        width: '100%',
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginTop: '20px',
    },
    settingsSection: {
        display: 'flex',
        flexDirection: 'column',
        padding: '1em',
        maxWidth: '300px',
    },
    searchQueryCard: {
        marginBottom: '20px'
    },
    imagesPerQueryControl: {
        marginTop: '20px',
    },
    paramControl: {
        marginTop: '20px'
    },
    formControl: {
        margin: "20px",
        minWidth: 120,
    },
    gallery: {
        display: 'flex',
        flex: '1',
        maxWidth: '50%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '1rem',
    },
});

const NOTIFICATION_ICON = "https://camo.githubusercontent.com/95d3eed25e464b300d56e93644a26c8236a19e04572cf83a95c9d68f8126be83/68747470733a2f2f656d6f6a6970656469612d75732e73332e6475616c737461636b2e75732d776573742d312e616d617a6f6e6177732e636f6d2f7468756d62732f3234302f6170706c652f3238352f776f6d616e2d6172746973745f31663436392d323030642d31663361382e706e67";

const App = ({ classes }) => {
    const [backendUrl, setBackendUrl] = useState('');
    const [promptText, setPromptText] = useState('');
    const [isFetchingImgs, setIsFetchingImgs] = useState(false);
    const [isCheckingBackendEndpoint, setIsCheckingBackendEndpoint] = useState(false);
    const [isValidBackendEndpoint, setIsValidBackendEndpoint] = useState(true);
    const [notificationsOn, setNotificationsOn] = useState(false);

    const [generatedImages, setGeneratedImages] = useState([]);
    const [generatedImagesFormat, setGeneratedImagesFormat] = useState('jpeg');

    const [apiError, setApiError] = useState('')
    // generation options
    const [imagesPerQuery, setImagesPerQuery] = useState(2);
    const [topK, setTopK] = useState(80);
    const [topP, setTopP] = useState(0.9);
    const [temperature, setTemperature] = useState(0.8);
    const [condScale, setCondScale] = useState(10.0);

    const [queryTime, setQueryTime] = useState(0);

    const imagesPerQueryOptions = 10
    const lowValSliderOptions = [0.0, 1.5, 0.01] // min,max,step; used for topK, topP, temperature
    const topKSliderOptions = [0, 100, 1]
    const highValSliderOptions = [0.0, 50., 0.1] // used for condScale
    const validBackendUrl = isValidBackendEndpoint && backendUrl

    function enterPressedCallback(promptText) {
        console.log('API call to DALL-E web service with the following prompt [' + promptText + ']');
        setApiError('')
        setIsFetchingImgs(true)
        callDalleService(backendUrl, promptText, imagesPerQuery, topK, topP, temperature, condScale).then((response) => {
            setQueryTime(response['executionTime'])
            setGeneratedImages(response['serverResponse']['generatedImgs'])
            setGeneratedImagesFormat(response['serverResponse']['generatedImgsFormat'])
            setIsFetchingImgs(false)

            if (notificationsOn) {
                new Notification(
                    "Your DALL-E images are ready!",
                    {
                        body: `Your generations for "${promptText}" are ready to view`,
                        icon: NOTIFICATION_ICON,
                    },
                )
            }
        }).catch((error) => {
            console.log('Error querying DALL-E service.', error)
            if (error.message === 'Timeout') {
                setApiError('Timeout querying DALL-E service (>1min). Consider reducing the images per query or use a stronger backend.')
            } else {
                setApiError('Error querying DALL-E service. Check your backend server logs.')
            }
            setIsFetchingImgs(false)
        })
    }

    function getGalleryContent() {
        if (apiError) {
            return <Typography variant="h5" color="error">{apiError}</Typography>
        }

        if (isFetchingImgs) {
            return <LoadingSpinner isLoading={isFetchingImgs} />
        }

        return <GeneratedImageList generatedImages={generatedImages} generatedImagesFormat={generatedImagesFormat} promptText={promptText} />
    }


    return (
        <div className={classes.root}>
            <div className={classes.title}>
                <Typography variant="h3">
                    DALL-E Playground <span role="img" aria-label="sparks-emoji">✨</span>
                </Typography>
            </div>

            {!validBackendUrl && <div>
                <Typography variant="body1" color="textSecondary">
                    Put your DALL-E backend URL to start
                </Typography>
            </div>}

            <div className={classes.playgroundSection}>
                <div className={classes.settingsSection}>
                    <Card className={classes.searchQueryCard}>
                        <CardContent>
                            <BackendUrlInput setBackendValidUrl={setBackendUrl}
                                isValidBackendEndpoint={isValidBackendEndpoint}
                                setIsValidBackendEndpoint={setIsValidBackendEndpoint}
                                setIsCheckingBackendEndpoint={setIsCheckingBackendEndpoint}
                                isCheckingBackendEndpoint={isCheckingBackendEndpoint}
                                disabled={isFetchingImgs} />

                            <TextPromptInput enterPressedCallback={enterPressedCallback} promptText={promptText} setPromptText={setPromptText}
                                disabled={isFetchingImgs || !validBackendUrl} />

                            <NotificationCheckbox isNotificationOn={notificationsOn} setNotifications={setNotificationsOn}/>

                            <FormControl className={classes.imagesPerQueryControl}
                                variant="outlined">
                                <InputLabel id="images-per-query-label">
                                    Images to generate
                                </InputLabel>
                                <Select labelId="images-per-query-label"
                                    label="Images per text prompt" value={imagesPerQuery}
                                    disabled={isFetchingImgs}
                                    onChange={(event) => setImagesPerQuery(event.target.value)}>
                                    {Array.from(Array(imagesPerQueryOptions).keys()).map((num) => {
                                        return <MenuItem key={num + 1} value={num + 1}>
                                            {num + 1}
                                        </MenuItem>
                                    })}
                                </Select>
                                <FormHelperText>More images = More time to generate</FormHelperText>
                            </FormControl>
                            <FormControl className={classes.paramControl}
                                variant="outlined">
                                <InputLabel id="top-k-label">
                                  TopK: {topK}
                                </InputLabel>
                                <Slider labelId = "top-k-label"
                                    label="Top K: "
                                    disabled={isFetchingImgs}
                                    onChange={(e, v) => setTopK(v)}
                                    valueLabelDisplay="auto"
                                    min={topKSliderOptions[0]}
                                    max={topKSliderOptions[1]}
                                    step={topKSliderOptions[2]}
                                value={topK}
                                />
                                <FormHelperText>Top K Generation Parameter</FormHelperText>
                            </FormControl>
                            <FormControl className={classes.paramControl}
                                variant="outlined">
                                <InputLabel id="top-p-label">
                                  TopP: {topP}
                                </InputLabel>
                                <Slider labelId = "top-p-label"
                                    label="Top P: " value={topP}
                                    disabled={isFetchingImgs}
                                    onChange={(e, v) => setTopP(v)}
                                    valueLabelDisplay="auto"
                                    min={lowValSliderOptions[0]}
                                    max={lowValSliderOptions[1]}
                                    step={lowValSliderOptions[2]}/>
                                <FormHelperText>Top P Generation Parameter</FormHelperText>
                            </FormControl>
                            <FormControl className={classes.paramControl}
                                variant="outlined">
                                <InputLabel id="temperature-label">
                                  Temperature: {temperature}
                                </InputLabel>
                                <Slider labelId = "temperature-label"
                                    label="Temperature: " value={temperature}
                                    disabled={isFetchingImgs}
                                    onChange={(e, v) => setTemperature(v)}
                                    valueLabelDisplay="auto"
                                    min={lowValSliderOptions[0]}
                                    max={lowValSliderOptions[1]}
                                    step={lowValSliderOptions[2]}/>
                                <FormHelperText>Temperature Generation Parameter</FormHelperText>
                            </FormControl>
                            <FormControl className={classes.paramControl}
                                variant="outlined">
                                <InputLabel id="cond-scale-label">
                                  Cond Scale: {condScale}
                                </InputLabel>
                                <Slider labelId = "cond-scale-label"
                                    label="Cond scale: " value={condScale}
                                    disabled={isFetchingImgs}
                                    onChange={(e, v) => setCondScale(v)}
                                    valueLabelDisplay="auto"
                                    min={highValSliderOptions[0]}
                                    max={highValSliderOptions[1]}
                                    step={highValSliderOptions[2]}/>
                                <FormHelperText>Cond Scale Generation Parameter</FormHelperText>
                            </FormControl>
                        </CardContent>
                    </Card>
                    {queryTime !== 0 && <Typography variant="body2" color="textSecondary">
                        Generation execution time: {queryTime} sec
                    </Typography>}
                </div>
                
                {(generatedImages.length > 0 || apiError || isFetchingImgs) &&
                    <div className={classes.gallery}>
                        {getGalleryContent()}
                    </div>
                }
            </div>
        </div>
    )
}

export default withStyles(useStyles)(App);
