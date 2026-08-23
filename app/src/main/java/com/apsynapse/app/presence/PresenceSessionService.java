package com.apsynapse.app.presence;

import android.os.Bundle;
import android.service.voice.VoiceInteractionSession;
import android.service.voice.VoiceInteractionSessionService;

public class PresenceSessionService
    extends VoiceInteractionSessionService {

    @Override
    public VoiceInteractionSession onNewSession(
        Bundle args
    ) {

        return new PresenceSession(this);
    }
}
