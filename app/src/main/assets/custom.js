console.log(
    '%cbuild from PakePlus： https://github.com/Sjj1024/PakePlus',
    'color:orangered;font-weight:bolder'
)

// very important, if you don't know what it is, don't touch it
// 非常重要，不懂代码不要动，这里可以解决80%的问题，也可以生产1000+的bug
const hookClick = (e) => {
    const origin = e.target.closest('a')
    const isBaseTargetBlank = document.querySelector(
        'head base[target="_blank"]'
    )
    console.log('origin', origin, isBaseTargetBlank)
    if (
        (origin && origin.href && origin.target === '_blank') ||
        (origin && origin.href && isBaseTargetBlank)
    ) {
        e.preventDefault()
        console.log('handle origin', origin)
        location.href = origin.href
    } else {
        console.log('not handle origin', origin)
    }
}

document.addEventListener('click', hookClick, { capture: true })
// ==UserScript==
// @name         论道中文重构版
// @namespace    https://bbs.tampermonkey.net.cn/
// @version      0.1.0
// @description  技术有限，且用且改
// @author       changhong
// @match        http://124.220.39.243/*
// ==/UserScript==

(function() {
    'use strict';

    /*
 * 论道脚本(重构版)
 * 全中文，减少使用者的上手难度
 * 技术有限，代码丑陋，能用就行
 * 摸鱼时间偷写，其他功能有空再写
 * 卖装备这个函数我这次是副本装备没有精炼的全卖，不能卖的注意提前精炼或者锁住
 */



//脚本配置
const 配置列表 = {
    /*关于配置列表
    登录界面的角色列表代表你要创建和删除的角色名称，根据喜好替换
    账户密码就是你自己游戏的密码，没有后门，主要用来删除角色使用
    */
    登录界面: {
        角色列表: ["东邪", "西毒", "南帝", "北丐"],
        账户密码: "",
        菜单: [{
            名称: "开始刷元宝",
            功能: () => { 开始刷元宝() }
        }, {
            名称: "结束刷元宝",
            功能: () => { 结束刷元宝() }
        }]
    },
    游戏界面: {
        轮询时间:150,
        副本指令:"go_fuben /fuben/fuben/daitoudage 0 10",//这个是你要刷的脚本的指令，吃丹不用，已经内嵌
        菜单: [
            {
                name:'拆装',
                cmd:'$menu(yjcc)',
                action:() =>{
                    拆解装备()
                }
            },
            {
                name: '卖装',
                cmd: '$menu(yjmc)',
                action: () => {
                    出售装备()
                }
            },
            {
                name: '刷本',
                cmd: '$menu(saled)',
                action: () => {
                    刷本();
                }
            },
            {
                name: '急停',
                cmd: '$menu(stop)',
                action: () => {
                    停止所有定时器()
                }
            }
        ]
    }
}




//功能函数
function 当前页面() {
    const dom = document.querySelector(".login-container")
    if (dom) {
        return "登录界面"
    }
    return "游戏界面"
}
function 创建菜单按钮(按钮配置, 页面) {
    if (页面 == "登录界面") {
        const 按钮 = document.createElement("button")
        按钮.textContent = 按钮配置.名称
        按钮.setAttribute("class", "btn-tis")
        按钮.setAttribute("type", "button")
        按钮.addEventListener("click", 按钮配置.功能)
        return 按钮
    }
    const 按钮 = document.createElement('span');
    按钮.setAttribute('cmd', 按钮配置.cmd);
    按钮.setAttribute('data-name', 按钮配置.name);
    按钮.addEventListener('click', 按钮配置.action);

    return 按钮;

}
function 批量创建按钮(页面) {
    if (页面 == "登录界面") {
        const 对象 = document.querySelector(".login-container")
        配置列表.登录界面.菜单.forEach(配置 => {
            const 新按钮 = 创建菜单按钮(配置, 页面)
            对象.appendChild(新按钮)
        })
    } else {
        const 对象 = document.querySelector('.jhmud-menu-list');
        配置列表.游戏界面.菜单.forEach(配置 => {
            const 新按钮 = 创建菜单按钮(配置, 页面)
            对象.appendChild(新按钮)
        })
    }

}
const 轮询数组 = []
const 指令数组 = []
function 刷本(){
    停止所有定时器()
    const 背包物品列表 = Dialog.pack.items
    SendCommand("pack none")
    背包物品列表.forEach(物品 =>{
        if(物品.name.includes("养精丹")){
            const 养精丹 = "use "+物品.id
            指令数组.push(养精丹)
        }
    })
    const 轮询 = setInterval(()=>{
        指令数组.forEach(指令=>{
            SendCommand(指令)
        })
        SendCommand(配置列表.游戏界面.副本指令)
    },配置列表.游戏界面.轮询时间)
    轮询数组.push(轮询)

}
function 停止所有定时器(){
    轮询数组.forEach(轮询 =>{
        clearInterval(轮询)
    })
    轮询数组.length = 0
    指令数组.length = 0
}
function 延迟(毫秒){
    return new Promise(resolve => setTimeout(resolve,毫秒))
}
async function 轮询检查(待检项, 超时 = 5000){
     const 开始时间 = Date.now();
    while (!待检项()) {
        if (Date.now() - 开始时间 > 超时) {
            throw new Error("等待数据超时");
        }
        await 延迟(100);
    }
}
async function 出售装备() {
    停止所有定时器();
    SendCommand("stopstate");
    SendCommand("jh fam 0 11");
    SendCommand("list");

    try {
        await 轮询检查(() => Dialog.list?.seller && Dialog.pack?.items);

        const npc = Dialog.list.seller;
        const 背包物品列表 = Dialog.pack.items;
        指令数组.length = 0;

        背包物品列表.forEach(物品 => {
            if (物品.id.includes("equip") && 物品.count == 1 && !物品.name.includes("Lv")) {
                指令数组.push(`sell 1 ${物品.id} to ${npc}`);
            }
        });

        for (const 指令 of 指令数组) {
            SendCommand(指令);
            await 延迟(配置列表.游戏界面.轮询时间);
        }
        console.log("出售成功")
    } catch (err) {
        console.error("出售装备失败:", err);
    }
}
async function 拆解装备() {
    停止所有定时器();
    SendCommand("stopstate");
    SendCommand("jh fam 0 10");
    SendCommand("u")

    try {
        await 轮询检查(() => Dialog.pack?.items);
        const 背包物品列表 = Dialog.pack.items;
        指令数组.length = 0;

        背包物品列表.forEach(物品 => {
            if (物品.id.includes("equip") && 物品.count == 1 && !物品.name.includes("Lv")) {
                指令数组.push(`chaijie ${物品.id} -yes`);
            }
        });

        for (const 指令 of 指令数组) {
            SendCommand(指令);
            await 延迟(配置列表.游戏界面.轮询时间);
        }
        console.log("拆解成功")
    } catch (err) {
        console.error("出售装备失败:", err);
    }
}
//状态检测
let 上次页面 = 当前页面()
setInterval(()=>{
    const 当前页 = 当前页面()
    if(当前页 !== 上次页面){
        上次页面 = 当前页
        批量创建按钮(当前页)
    }
},1000)
function 开始刷元宝() {
    //待定
}
function 结束刷元宝() {
    //待定
}
})();