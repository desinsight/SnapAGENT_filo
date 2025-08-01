const mongoose = require('mongoose');

/**
 * 모듈 모델
 * 분야별 맞춤 모듈 및 관리자 기능 제공
 */
const moduleSchema = new mongoose.Schema({
  // 기본 정보
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  version: {
    type: String,
    required: true,
    default: '1.0.0'
  },
  category: {
    type: String,
    enum: ['business', 'education', 'healthcare', 'government', 'nonprofit', 'personal', 'custom'],
    required: true
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: 100
  },

  // 모듈 타입 및 기능
  type: {
    type: String,
    enum: ['calendar_extension', 'event_template', 'workflow', 'integration', 'analytics', 'automation', 'custom'],
    required: true
  },
  features: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    config: {
      type: mongoose.Schema.Types.Mixed
    }
  }],

  // 설정 및 구성
  configuration: {
    isEnabled: {
      type: Boolean,
      default: true
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    requiresApproval: {
      type: Boolean,
      default: false
    },
    maxUsers: {
      type: Number,
      default: -1 // -1은 무제한
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    permissions: {
      view: {
        type: [String],
        default: ['user']
      },
      edit: {
        type: [String],
        default: ['admin']
      },
      delete: {
        type: [String],
        default: ['admin']
      },
      manage: {
        type: [String],
        default: ['admin']
      }
    }
  },

  // UI/UX 설정
  ui: {
    icon: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      default: '#007bff'
    },
    position: {
      type: String,
      enum: ['sidebar', 'topbar', 'dashboard', 'floating', 'hidden'],
      default: 'sidebar'
    },
    order: {
      type: Number,
      default: 0
    },
    showInMenu: {
      type: Boolean,
      default: true
    },
    showInDashboard: {
      type: Boolean,
      default: false
    },
    customCSS: {
      type: String,
      trim: true
    },
    customJS: {
      type: String,
      trim: true
    }
  },

  // 데이터 및 스키마
  dataSchema: {
    collections: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      displayName: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      schema: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      indexes: [{
        fields: {
          type: mongoose.Schema.Types.Mixed,
          required: true
        },
        options: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        }
      }],
      validation: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    }],
    relationships: [{
      from: {
        collection: {
          type: String,
          required: true
        },
        field: {
          type: String,
          required: true
        }
      },
      to: {
        collection: {
          type: String,
          required: true
        },
        field: {
          type: String,
          required: true
        }
      },
      type: {
        type: String,
        enum: ['one_to_one', 'one_to_many', 'many_to_many'],
        required: true
      },
      cascade: {
        type: String,
        enum: ['none', 'delete', 'update'],
        default: 'none'
      }
    }]
  },

  // API 및 엔드포인트
  api: {
    endpoints: [{
      path: {
        type: String,
        required: true,
        trim: true
      },
      method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        required: true
      },
      description: {
        type: String,
        trim: true
      },
      handler: {
        type: String,
        trim: true
      },
      middleware: [{
        type: String,
        trim: true
      }],
      validation: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      permissions: {
        type: [String],
        default: ['user']
      }
    }],
    webhooks: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      url: {
        type: String,
        required: true,
        trim: true
      },
      events: [{
        type: String,
        trim: true
      }],
      headers: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }]
  },

  // 워크플로우 및 자동화
  workflows: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    trigger: {
      type: {
        type: String,
        enum: ['event', 'schedule', 'manual', 'webhook'],
        required: true
      },
      event: {
        type: String,
        trim: true
      },
      schedule: {
        type: String,
        trim: true
      },
      conditions: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    },
    steps: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      type: {
        type: String,
        enum: ['action', 'condition', 'loop', 'delay', 'notification'],
        required: true
      },
      config: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      order: {
        type: Number,
        required: true
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // 통계 및 분석
  analytics: {
    enabled: {
      type: Boolean,
      default: false
    },
    metrics: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      type: {
        type: String,
        enum: ['counter', 'gauge', 'histogram', 'summary'],
        required: true
      },
      query: {
        type: String,
        trim: true
      },
      aggregation: {
        type: String,
        enum: ['sum', 'avg', 'min', 'max', 'count', 'custom'],
        default: 'count'
      },
      interval: {
        type: String,
        enum: ['minute', 'hour', 'day', 'week', 'month'],
        default: 'day'
      }
    }],
    dashboards: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      layout: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      widgets: [{
        type: {
          type: String,
          enum: ['chart', 'table', 'metric', 'list'],
          required: true
        },
        config: {
          type: mongoose.Schema.Types.Mixed,
          required: true
        }
      }]
    }]
  },

  // 의존성 및 호환성
  dependencies: {
    modules: [{
      moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module'
      },
      name: {
        type: String,
        trim: true
      },
      version: {
        type: String,
        trim: true
      },
      required: {
        type: Boolean,
        default: false
      }
    }],
    services: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      version: {
        type: String,
        trim: true
      },
      required: {
        type: Boolean,
        default: false
      }
    }],
    permissions: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      required: {
        type: Boolean,
        default: false
      }
    }]
  },

  // 상태 및 관리
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'deprecated', 'archived'],
    default: 'draft'
  },
  installationCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },

  // 메타데이터
  metadata: {
    tags: [{
      type: String,
      trim: true
    }],
    keywords: [{
      type: String,
      trim: true
    }],
    documentation: {
      type: String,
      trim: true
    },
    support: {
      email: {
        type: String,
        trim: true
      },
      website: {
        type: String,
        trim: true
      }
    },
    license: {
      type: String,
      trim: true
    },
    customData: {
      type: mongoose.Schema.Types.Mixed
    }
  },

  // 생성자 정보
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true // createdAt, updatedAt 자동 관리
});

// 인덱스 설정
moduleSchema.index({ category: 1, subcategory: 1 });
moduleSchema.index({ type: 1, status: 1 });
moduleSchema.index({ 'configuration.isEnabled': 1, 'configuration.isPublic': 1 });
moduleSchema.index({ status: 1, createdAt: -1 });
moduleSchema.index({ rating: -1, installationCount: -1 });

// 가상 필드
moduleSchema.virtual('isInstalled').get(function() {
  return this.installationCount > 0;
});

moduleSchema.virtual('isPopular').get(function() {
  return this.installationCount > 100 || this.rating.average > 4.0;
});

// 메서드
moduleSchema.methods.incrementInstallation = function() {
  this.installationCount += 1;
  return this.save();
};

moduleSchema.methods.updateRating = function(newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

moduleSchema.methods.enable = function() {
  this.configuration.isEnabled = true;
  this.status = 'active';
  return this.save();
};

moduleSchema.methods.disable = function() {
  this.configuration.isEnabled = false;
  this.status = 'inactive';
  return this.save();
};

// 정적 메서드
moduleSchema.statics.findByCategory = function(category) {
  return this.find({ category, status: 'active' }).sort({ installationCount: -1 });
};

moduleSchema.statics.findPublicModules = function() {
  return this.find({ 
    'configuration.isPublic': true, 
    status: 'active' 
  }).sort({ rating: -1, installationCount: -1 });
};

moduleSchema.statics.findPopularModules = function(limit = 10) {
  return this.find({ 
    status: 'active',
    installationCount: { $gt: 0 }
  })
  .sort({ installationCount: -1, rating: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Module', moduleSchema); 