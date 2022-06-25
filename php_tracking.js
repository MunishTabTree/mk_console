module.exports = (io) =>{
    const conn_client = io.of('/php_tracking_client')
    const conn_admin = io.of('/php_tracking_admin')
    const app_count = []
    const users = [];
    const admin_roomid = 'admin'
    const getroomlist = []
    const getroomlist_array = []
    conn_client.on("connect", socket => {
        console.log('mk path connect')
        socket.emit('welcome', 'Welcome User')
        socket.on('connect_user', data => {
            const roomid = data.app+data.appcode
            // console.log(app_count.length)
            if(!app_count.includes(data.app)) {
                app_count.push(data.app)
                conn_client.emit('new_App_created', data.app)
            }

            socket.join(roomid)
            if(!getroomlist_array.includes(roomid)){
                getroomlist_array.push(roomid)
                getroomlist.push({roomid, app: data.app})
                conn_client.emit('new_room_created', {roomid, app: data.app})
            }
            const checkUser =  users.findIndex((x)=>x.userid == data.userid && x.appcode == data.appcode && data.app == x.app)
            if(!(checkUser+1)){
                const csid = data.app +  data.appcode + data.userid
                data.mainroomid = roomid
                socket.handshake.auth.custom_userid = csid
                data.status = 'Active'
                data.customuserid = csid
                data.first_at = new Date()
                users.push(data)
                conn_client.emit('new_user_connected', data)
            } else {
                data.status = 'Active'
                users[checkUser] = {...users[checkUser],...data, status: 'Active', updated_at: new Date()}
                conn_client.emit('changeUserDataStatus', users[checkUser])
            }
        })

        socket.on('connect_admin', data => {
            socket.emit('php_apps_list', app_count)
            socket.emit('room_list', getroomlist)
            socket.emit('apps_list', users)
            console.log(getroomlist)
        })

        socket.on('disconnect', data => {
            // console.log(socket.handshake)
            if(socket.handshake.auth.custom_userid) {
                console.log(socket.handshake.auth)
                const customuserid = socket.handshake.auth.custom_userid
                const get_index = users.findIndex((x) => x.customuserid == customuserid)
                users[get_index].status = 'Disconnected'
                users[get_index].disconnected_at = new Date()
                conn_client.emit('changeUserDataStatus', users[get_index])
            }
        })
    })
}