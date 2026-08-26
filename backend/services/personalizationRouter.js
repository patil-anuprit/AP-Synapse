import express from "express";

import {

    resolvePersonalizationIdentity,

    ensurePersonalizationIdentity,

    getPersonalizationProfile,

    updatePersonalizationProfile,

    listPersonalizationMemories,

    rememberPersonalizationFact,

    deletePersonalizationMemory,

    clearPersonalizationMemory

} from "./personalizationService.js";


const router =
    express.Router();


function identityFor(
    req
) {

    const sessionId =

        req.headers[
            "x-session-id"
        ] ||

        req.ip ||

        "default";


    return resolvePersonalizationIdentity(
        req,
        sessionId
    );

}


router.get(
    "/profile",

    async (
        req,
        res
    ) => {

        try {

            const identity =
                identityFor(
                    req
                );


            await ensurePersonalizationIdentity(
                identity.identityId
            );


            const profile =
                await getPersonalizationProfile(
                    identity.identityId
                );


            return res.json({

                success:
                    true,

                authenticated:
                    identity.authenticated,

                profile

            });

        }
        catch (error) {

            console.error(
                "Personalization profile read failed:",
                error?.message ||
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    error:
                        "Unable to load personalization."

                });

        }

    }
);


router.put(
    "/profile",

    async (
        req,
        res
    ) => {

        try {

            const identity =
                identityFor(
                    req
                );


            const profile =
                await updatePersonalizationProfile(

                    identity.identityId,

                    req.body ||
                    {}

                );


            return res.json({

                success:
                    true,

                authenticated:
                    identity.authenticated,

                profile

            });

        }
        catch (error) {

            console.error(
                "Personalization profile update failed:",
                error?.message ||
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    error:
                        "Unable to save personalization."

                });

        }

    }
);


router.get(
    "/memories",

    async (
        req,
        res
    ) => {

        try {

            const identity =
                identityFor(
                    req
                );


            const memories =
                await listPersonalizationMemories(

                    identity.identityId,

                    req.query?.limit

                );


            return res.json({

                success:
                    true,

                memories

            });

        }
        catch (error) {

            console.error(
                "Personalization memory read failed:",
                error?.message ||
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    error:
                        "Unable to load memories."

                });

        }

    }
);


router.post(
    "/memories",

    async (
        req,
        res
    ) => {

        try {

            const identity =
                identityFor(
                    req
                );


            const memory =
                await rememberPersonalizationFact(

                    identity.identityId,

                    req.body ||
                    {}

                );


            return res.json({

                success:
                    true,

                memory

            });

        }
        catch (error) {

            console.error(
                "Personalization memory save failed:",
                error?.message ||
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    error:
                        "Unable to save memory."

                });

        }

    }
);


router.delete(
    "/memories/:id",

    async (
        req,
        res
    ) => {

        try {

            const identity =
                identityFor(
                    req
                );


            await deletePersonalizationMemory(

                identity.identityId,

                req.params.id

            );


            return res.json({
                success: true
            });

        }
        catch (error) {

            console.error(
                "Personalization memory delete failed:",
                error?.message ||
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    error:
                        "Unable to forget memory."

                });

        }

    }
);


router.delete(
    "/memories",

    async (
        req,
        res
    ) => {

        try {

            const identity =
                identityFor(
                    req
                );


            await clearPersonalizationMemory(
                identity.identityId
            );


            return res.json({
                success: true
            });

        }
        catch (error) {

            console.error(
                "Personalization memory clear failed:",
                error?.message ||
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    error:
                        "Unable to clear memory."

                });

        }

    }
);


export default router;
