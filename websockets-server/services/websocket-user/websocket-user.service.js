class WebsocketUserService {
    constructor() {
        this.users = [];
    }

    addUser(userToAdd) {
        console.log('Adding user...');
        const userIndex = this.getUserIndex(userToAdd);
        if (userIndex === -1) {
            this.users.push(userToAdd);
        } else {
            this.updateUser(userToAdd);
        }
    }

    updateUser(userToUpdate) {
        console.log('Updating user...');
        const userIndex = this.getUserIndex(userToUpdate);
        if (userIndex !== -1) {
            this.users[userIndex] = userToUpdate;
        } else {
            this.addUser(userToUpdate);
        }
    }

    removeUser(userToRemove) {
        console.log('Removing user...');
        const userIndex = this.getUserIndex(userToRemove);
        if (userIndex !== -1) {
            this.users.splice(userIndex, 1);
        }
    }

    getUserIndex(userSearch) {
        return this.users.findIndex(user => user.id === userSearch.id);
    }

    getUsers(currentUserId) {
        return this.users;
    }
}

module.exports = WebsocketUserService;
