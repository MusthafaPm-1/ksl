import { useEffect } from "react";
import socket from "../socket";

function LiveMatchSocket({
    matchId,
    onMatchUpdate,
    onMatchEvent
}) {

    useEffect(() => {

        if (!matchId) {
            return;
        }

        const numericMatchId =
            Number(matchId);


        /* =================================================
           MATCH UPDATED
        ================================================= */

        function handleMatchUpdated(data) {

            if (
                Number(data.matchId) !==
                numericMatchId
            ) {
                return;
            }

            console.log(
                "Live match updated:",
                data
            );

            if (onMatchUpdate) {

                onMatchUpdate(data);

            }

        }


        /* =================================================
           NEW MATCH EVENT
        ================================================= */

        function handleMatchEvent(data) {

            if (
                Number(data.matchId) !==
                numericMatchId
            ) {
                return;
            }

            console.log(
                "New match event:",
                data
            );

            if (onMatchEvent) {

                onMatchEvent(data);

            }

        }


        /* =================================================
           CONNECT
        ================================================= */

        function handleConnect() {

            console.log(
                "Connected to live match server:",
                socket.id
            );

        }


        /* =================================================
           DISCONNECT
        ================================================= */

        function handleDisconnect() {

            console.log(
                "Disconnected from live match server"
            );

        }


        /* =================================================
           LISTENERS
        ================================================= */

        socket.on(
            "connect",
            handleConnect
        );

        socket.on(
            "disconnect",
            handleDisconnect
        );

        socket.on(
            "matchUpdated",
            handleMatchUpdated
        );

        socket.on(
            "matchEvent",
            handleMatchEvent
        );


        /* =================================================
           CLEANUP
        ================================================= */

        return () => {

            socket.off(
                "connect",
                handleConnect
            );

            socket.off(
                "disconnect",
                handleDisconnect
            );

            socket.off(
                "matchUpdated",
                handleMatchUpdated
            );

            socket.off(
                "matchEvent",
                handleMatchEvent
            );

        };

    }, [
        matchId,
        onMatchUpdate,
        onMatchEvent
    ]);


    return null;
}

export default LiveMatchSocket;