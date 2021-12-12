/*
 * libGeofence
 *
 * Author: MiGoller
 * 
 * Copyright (c) 2021 MiGoller
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createLocation, distanceTo, headingDistanceTo, LatLon } from 'geolocation-utils'

/**
 * Helper function to generate a GUID
 * @returns GUID
 */
 function CreateGuid() {  
    function _p8(s?: boolean) {  
        const p = (Math.random().toString(16)+"000000000").substr(2,8);  
        return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;  
    }  
    return _p8() + _p8(true) + _p8(true) + _p8();  
}

function _indexOfById(array:any, id: string) {
    for (let index = 0; index < array.length; index++) {
        const element = array[index];
        
        if (element.id === id) return index;
    }

    return -1;
}

function _indexOfByName(array:any, name: string) {
    for (let index = 0; index < array.length; index++) {
        const element = array[index];
        
        if (element.name === name) return index;
    }

    return -1;
}

/**
 * Creates an OpenStreetMap URL to show the given position.
 * @param {number} lat Set to GPS latitude.
 * @param {number} lon Set to GPS longitude.
 * @param {number} zoom Set to zoom factor 1 up to 19.
 */
 function getOpenStreetMapUrl(location: LatLon, zoom = 15) {
    return `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lon}#map=${zoom}/${location.lat}/${location.lon}`;
}

export function getGeoLocation(lat: number, lng: number) {
    return createLocation(lat, lng, "LatLng");
}

export function getDistance(from: LatLon, to: LatLon) {
    return distanceTo(from, to);
}

export function getHeadingDistance(from: LatLon, to: LatLon) {
    return headingDistanceTo(from, to);
}

class TypeBase {
    name: string;
    id: string;
    data: any;

    constructor(name: string, id?: string, data?: any) {
        this.name = name;

        if (id === undefined) {
            this.id = CreateGuid();
        }
        else {
            this.id = id;
        }

        this.data = data;
    }
}

class PositionType extends TypeBase {
    // lat: number | undefined;
    // lng: number | undefined;
    location!: LatLon;
    openStreetMapUrl!: string;

    constructor(name: string, lat = 0, lng = 0, id?: string, data?: any) {
        super(name, id, data);

        // this.location = createLocation(0, 0, "LatLon");

        this.updateGpsPosition(lat, lng);
    }

    updateGpsPosition(lat: number, lng: number) {

        // this.lat = lat;
        // this.lng = lng;

        this.location = createLocation(lat, lng, "LatLon");
        this.openStreetMapUrl = getOpenStreetMapUrl(this.location, 15);
    }

}

class ControllerPositionType extends PositionType {
    controller: Controller | undefined;
    constructor(name: string, lat?: number, lng?: number, id?: string, data?: any, controller?: Controller) {
        super(name, lat, lng, id, data);

        this.controller = controller;

        if (this.controller) {
            this.controller.notifyPositionUpdate(this);
        }
    }

    updateGpsPosition(lat: number, lng: number) {
        super.updateGpsPosition(lat, lng);

        //  Notifiy controller about person's position update?
        if (this.controller) {
            this.controller.notifyPositionUpdate(this);
        }

        return this;
    }
}

class ListBase<T> extends Array<T> {

    indexOfById(id: string) {
        return _indexOfById(this, id);
    }

    indexOfByName(name: string) {
        return _indexOfByName(this, name);
    }

    indexOfByElement(element: TypeBase) {
        if (element.id === undefined)
            return this.indexOfByName(element.name);
        else
            return this.indexOfById(element.id);
    }

    byId(id: string) {
        return this.byIndex(this.indexOfById(id));

        // const index = this.indexOfById(id);

        // if (index == -1)
        //     return undefined;
        // else
        //     return this[index];
    }

    byName(name: string) {
        return this.byIndex(this.indexOfByName(name));

        // const index = this.indexOfByName(name);

        // if (index == -1)
        //     return undefined;
        // else
        //     return this[index];
    }

    byIndex(index: number) {
        if (index == -1)
            return undefined;
        else
            return this[index];
    }

    addElement(element: any) {
        const index = this.indexOfByElement(element);

        if (index == -1) {
            //  Add new element to list.
            this.push(element);
            return element;
        }
        else {
            //  Return existing
            return this.byIndex(index);
        }
    }

    removeElement(element: TypeBase) {
        const index = this.indexOfByElement(element);

        if (index == -1) {
            //  Element not found.
            throw new Error("Element not found.");
        }
        else {
            //  Remove existing element
            this.splice(index, 1);
        }
    }
}

class ControllerListBase<T> extends ListBase<T> {
    controller: Controller;
    constructor(controller: Controller) {
        super();
        this.controller = controller;
    }
}

class PersonList extends ControllerListBase<Person> {
    add(name: string, lat?: number, lng?: number, id?: string, data?: any) {
        const person = new Person(name, lat, lng, id, data, this.controller);

        return this.addPerson(person);
    }

    addPerson(element: Person) {
        Object.assign(element, this.addElement(element));
        return element;
    }
}

class FenceList extends ControllerListBase<Fence> {

    add(name: string, lat: number, lng: number, radius: number, id?: string, data?: any): Fence | undefined {

        const fence = new Fence(name, lat, lng, radius, id, data, this.controller);

        return this.addFence(fence);
    }

    addFence(element: Fence) {
        Object.assign(element, this.addElement(element));
        return element;
    }

    memberPositionUpdate(member: Person) {
        const locationMembers = new LocationMemberList();

        for (let index = 0; index < this.length; index++) {
            const fence: Fence = this[index];
            // locationMembers.push(fence.memberPositionUpdate(member));
            locationMembers.addElement(fence.memberPositionUpdate(member));
        }

        return locationMembers;
    }
}

class LocationMember extends PositionType {
    distance = 0;
    heading = 0;
    isPresent = false;

    constructor(member: PositionType) {
        super(member.name, member.location.lat, member.location.lon, member.id, member.data);
    }
}

class LocationMemberList extends ListBase<LocationMember> {
    locationsPresent!: string[];

    addElement(element: LocationMember) {
        super.addElement(element);

        this.locationsPresent = this.getPresentLocationMembersNames();
    }

    removeElement(element: LocationMember): void {
        super.removeElement(element);
        
        this.locationsPresent = this.getPresentLocationMembersNames();
    }

    getLocationMembersNames(presentMembersOnly = false) {
        const mNames = new Array<string>();

        for (let index = 0; index < this.length; index++) {
            if (presentMembersOnly) {
                if (this[index].isPresent)
                mNames.push(this[index].name);
            }
            else 
                mNames.push(this[index].name);
        }

        return mNames;
    }

    getPresentLocationMembersNames() {
        return this.getLocationMembersNames(true);
    }
}

class FenceMember extends LocationMember {
    // distance: number | undefined = undefined;
    // heading: number | undefined = undefined;
    // isPresent: boolean | undefined = undefined;
    endTimestamp: Date | undefined = undefined;
    startTimestamp: Date | undefined = undefined;
    timestamp: Date | undefined = undefined;

    constructor(person: Person) {
        // super(person.name, person.location.lat, person.location.lon, person.id, person.data);
        super(person);
    }
}

class FenceMemberList extends ListBase<FenceMember> {
    membersPresent!: string[];

    addElement(element: FenceMember) {
        super.addElement(element);

        this.membersPresent = this.getPresentMembersNames();
    }

    removeElement(element: FenceMember): void {
        super.removeElement(element);
        
        this.membersPresent = this.getPresentMembersNames();
    }

    getMembersNames(presentMembersOnly = false) {
        const mNames = new Array<string>();

        for (let index = 0; index < this.length; index++) {
            if (presentMembersOnly) {
                if (this[index].isPresent)
                mNames.push(this[index].name);
            }
            else 
                mNames.push(this[index].name);
        }

        return mNames;
    }

    getPresentMembersNames() {
        return this.getMembersNames(true);
    }
}

export class Person extends ControllerPositionType {
    memberLocations!: LocationMemberList;

    updateMemberLocations(memberLocations: LocationMemberList) {
        this.memberLocations = memberLocations;


    }
}

export class Fence extends ControllerPositionType {
    //  Define class members
    radius: number;
    members: FenceMemberList;
    // members: PersonList | undefined;

    constructor(name: string, lat: number, lng: number, radius: number, id?: string, data?: any, controller?: Controller) {
        super(name, lat, lng, id, data, controller);

        this.radius = radius;

        this.members = new FenceMemberList();

        // if (controller) this.members = controller.members;
    }

    memberPositionUpdate(member: Person) {
        //  Get the fence member for the person
        const index = this.members.indexOfByElement(member);

        let fenceMember = this.members.byIndex(index);

        if (fenceMember === undefined) {
            //  Add new member to this fence.
            fenceMember = new FenceMember(member);
            this.members.addElement(fenceMember);
        }

        //  Update the fence member from the person's location data
        this._updateFenceMember(fenceMember, member);

        //  Return fence-information for the person.
        const locationMember = new LocationMember(this);
        locationMember.distance = fenceMember.distance;
        locationMember.heading = (fenceMember.heading + 180) % 360;
        locationMember.isPresent = fenceMember.isPresent;

        return locationMember;
    }

    _updateFenceMember(member: FenceMember, positionData: PositionType) {
        const timestamp = new Date();

        //  Update member's distance to this fence.
        // member.distance = getDistance(this.location, positionData.location);
        const headingDistance = getHeadingDistance(this.location, positionData.location);
        member.distance = headingDistance.distance;
        member.heading = (headingDistance.heading + 360) % 360;

        //  Update presence status
        const newStatus = (member.distance <= this.radius);
        if (newStatus != member.isPresent) {
            if (newStatus) {
                //  Member has entered the fence.
                member.startTimestamp = timestamp;
            }
            else {
                //  Member has left the fence
                member.endTimestamp = timestamp;
            }

            member.isPresent = newStatus;
        }

        //  Update timestamp of last update
        member.timestamp = timestamp;

        // if (!((this.geoLocation === undefined) || (positionData.geoLocation === undefined))) {
        //     const timestamp = new Date();

        //     //  Update member's distance to this fence.
        //     member.distance = getDistance(this.geoLocation, positionData.geoLocation);

        //     //  Update presence status
        //     const newStatus = (member.distance <= this.radius);
        //     if (newStatus != member.isPresent) {
        //         if (newStatus) {
        //             //  Member has entered the fence.
        //             member.startTimestamp = timestamp;
        //         }
        //         else {
        //             //  Member has left the fence
        //             member.endTimestamp = timestamp;
        //         }

        //         member.isPresent = newStatus;
        //     }

        //     //  Update timestamp of last update
        //     member.timestamp = timestamp;
        // }
    }
}

export class Controller {
    fences: FenceList;
    members: PersonList;

    constructor() {
        this.fences = new FenceList(this);
        this.members = new PersonList(this);
    }

    notifyPositionUpdate(source: ControllerPositionType) {
        // console.dir(source, {depth: null, colors: true});

        if (source instanceof Fence) {
            //  A fence's position has been updated. ("Moving target").
            // throw new Error("Method not implemented: notifyPositionUpdate --> Fence !");
            console.warn("Method not implemented: notifyPositionUpdate --> Fence !");
        }
        else if (source instanceof Person) {
            //  A person's position has been updated.
            const memberLocations = this.fences.memberPositionUpdate(source);
            source.updateMemberLocations(memberLocations);
        }
        else
            throw new Error("Method not implemented.");
    }
}
