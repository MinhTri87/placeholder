/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 * @typedef {Object} DemoResponse
 * @property {string} message
 */

/**
 * User role types
 * @typedef {'manager' | 'member'} UserRole
 */

/**
 * User interface
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} email
 * @property {UserRole} role
 * @property {string} firstName
 * @property {string} lastName
 * @property {boolean} isActive
 * @property {string} createdAt
 * @property {string} [lastLogin]
 */

/**
 * Authentication request/response types
 * @typedef {Object} LoginRequest
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Object} LoginResponse
 * @property {boolean} success
 * @property {User} [user]
 * @property {string} [token]
 * @property {string} [message]
 */

/**
 * @typedef {Object} AuthCheckResponse
 * @property {boolean} isAuthenticated
 * @property {User} [user]
 */

/**
 * Group member management types
 * @typedef {Object} GroupMember
 * @property {string} id
 * @property {User} user
 * @property {string} joinedAt
 * @property {'active' | 'inactive' | 'pending'} status
 */

/**
 * @typedef {Object} GroupStats
 * @property {number} totalMembers
 * @property {number} activeMembers
 * @property {number} managersCount
 * @property {number} membersCount
 */

/**
 * Activity log types
 * @typedef {Object} ActivityLog
 * @property {string} id
 * @property {string} userId
 * @property {string} userName
 * @property {string} action
 * @property {string} details
 * @property {string} timestamp
 */

/**
 * API response wrapper
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {*} [data]
 * @property {string} [message]
 * @property {string} [error]
 */

/**
 * Project types
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {'active' | 'completed' | 'paused'} status
 * @property {string} createdBy
 * @property {string} createdAt
 * @property {string} [dueDate]
 * @property {string[]} memberIds
 */

/**
 * Task types
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {'pending' | 'in_progress' | 'completed'} status
 * @property {'low' | 'medium' | 'high'} priority
 * @property {string} projectId
 * @property {string} assignedTo
 * @property {string} createdBy
 * @property {string} createdAt
 * @property {string} [dueDate]
 */

/**
 * Chat message types
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} userId
 * @property {string} userName
 * @property {string} message
 * @property {string} timestamp
 * @property {'text' | 'system'} type
 */

/**
 * File upload types
 * @typedef {Object} FileUpload
 * @property {string} id
 * @property {string} name
 * @property {string} path
 * @property {string} size
 * @property {string} type
 * @property {string} uploadedBy
 * @property {string} uploadedAt
 */

// Export for CommonJS compatibility
if (typeof module !== "undefined" && module.exports) {
  module.exports = {};
}
