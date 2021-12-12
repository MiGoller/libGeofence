/*
 * libGeofence manual tests ...
 *
 * Author: MiGoller
 * 
 * Copyright (c) 2021 MiGoller
 */

"use strict;"

const myLib = require("../dist/index");

function main() {
    const controller = new myLib.Controller();

    //  Add geofence for Trou aux Biches (Mauritius).
    controller.fences.add(
        "Trou aux Biches (Mauritius)",
        -20.035945128751855, 57.54502539979058, 1500,
        undefined, 
        {
            oneMoreProp: "Test"
        }
    );

    //  Add geofence for Mauritius.
    controller.fences.add(
        "Mauritus",
        -20.22500307203002, 57.596781307159425, 45000,
        undefined, 
        undefined
    );

    //  Add person 1 @ Le Palmiste Resort & Spa (Trou aux Biches)
    controller.members.add(
        "Person 1 @ Le Palmiste Resort & Spa (Trou aux Biches)",
        -20.03763973619026, 57.54525070535466,
        undefined,
        undefined
    );

    //  Add person 2 @ Sands Grill (Ile aux Cerfs)
    controller.members.add(
        "Person 2 @ Sands Grill (Ile aux Cerfs)",
        -20.264087046973525, 57.80394708427764,
        undefined,
        undefined
    );

    //  Add person 3 @ Pito des Neiges, Réunion
    controller.members.add(
        "Person 3 @ Pito des Neiges, Réunion",
        -21.102795981674763, 55.47942404123997,
        undefined,
        undefined
    );

    //  Return controller data
    console.dir(controller, {depth: null, colors: true});

    //  Person 1 moved to Frankfurt Airport (FRA), Germany
    console.dir(controller.members[0].updateGpsPosition(50.05000395340715, 8.571657547519509), {depth: null, colors: true});

    //  Return present members for fence #2
    // console.dir(controller.fences[1].members.getPresentMembersNames(), {depth: null, colors: true});
}

main();
