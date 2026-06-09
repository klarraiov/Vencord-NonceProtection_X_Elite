/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { FluxDispatcher, MessageStore } from "@webpack/common";

interface AvatarDecorationData {
    asset: string;
    sku_id: string;
    expires_at: string | null;
}

interface DiscordUser {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
    discriminator: string;
    flags: number;
    public_flags: number;
    accent_color: number | null;
    banner: string | null;
    banner_color: string | null;
    avatar_decoration_data: AvatarDecorationData | null;
    clan: any;
    primary_guild: any;
}

interface DiscordMessage {
    id: string;
    channel_id: string;
    guild_id?: string;
    nonce?: string | null;
    content: string;
    author: DiscordUser;
    timestamp: string;
    edited_timestamp: string | null;
    type: number;
    pinned: boolean;
    tts: boolean;
    attachments: any[];
    embeds: any[];
    mentions: any[];
    mention_roles: any[];
    components: any[];
    flags: number;
}

interface DiscordMessageEventPayload {
    type: "MESSAGE_CREATE" | "MESSAGE_UPDATE";
    channelId: string;
    guildId?: string;
    message: DiscordMessage;
}

interface DiscordInternalUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    globalName: string | null;
    bot: boolean;
    system: boolean;
    mfaEnabled?: boolean;
    verified?: boolean;
    email?: string | null;
    phone?: string | null;
    [key: string]: any;
}

interface DiscordInternalMessage {
    id: string;
    channel_id: string;
    content: string;
    author: DiscordInternalUser;
    state: "SENDING" | "SENT" | "SEND_FAILED" | string;
    deleted: boolean;
    timestamp: string;
    editedTimestamp: string | null;
    [key: string]: any;
}

let unpatchDispatcher: () => void;

export default definePlugin(
    {
        name: "nProtection X Elite",
        description: "nProtection X Elite detects and blocks nonce-related exploits by validating messages before they are processed. Messages containing a nonce that matches a previous message ID are flagged, preventing them from replacing exising messages and protecting against unauthorized message manipulation.",
        authors: [{ name: "klarraiov", id: 534316896456146944n }],

        start() {
            if (!FluxDispatcher || !MessageStore) {
                console.error("[nProtection X Elite] Failed to find webpacks.");
                return;
            }

            const originalDispatch = FluxDispatcher.dispatch;
            FluxDispatcher.dispatch = function (param: any) {
                try {
                    const payload = param as DiscordMessageEventPayload;
                    if (payload && (payload.type === "MESSAGE_CREATE" || payload.type === "MESSAGE_UPDATE") && payload.message) {
                        if (payload.message.nonce && payload.message.nonce !== payload.message.id) {
                            const existingMessage = (MessageStore.getMessage(payload.message.channel_id, payload.message.nonce) as unknown) as DiscordInternalMessage;
                            if (existingMessage && existingMessage.state !== "SENDING") {
                                console.warn(`%c[nProtection X Elite] ${payload.message.author.username}(${payload.message.author.id}) sent a potentially forged message and NPXE protected the original message.`, "color: #ff4757; font-weight: bold; font-size: 12px;");
                                console.log(`Protected Message: ${existingMessage.content}(https://discord.com/channels/${payload.message.guild_id || "@me"}/${payload.message.channel_id}/${payload.message.nonce})\n` + `Forged Message: ${payload.message.content}(https://discord.com/channels/${payload.message.guild_id || "@me"}/${payload.message.channel_id}/${payload.message.id})`);

                                payload.message.nonce = `nProtection X Elite ${payload.message.nonce}`;
                            }
                        }
                    }
                }
                catch (error) {
                    console.error("[nProtection X Elite] Error occurred: ", error);
                }

                return originalDispatch.call(this, param);
            };

            unpatchDispatcher = () => {
                FluxDispatcher.dispatch = originalDispatch;
                console.log("[nProtection X Elite] Hook removed, plugin stopped.");
            };
        },

        stop() {
            if (unpatchDispatcher) {
                unpatchDispatcher();
            }
        }
    });
