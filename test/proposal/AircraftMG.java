package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;


import lombok.Data;

import java.io.Serializable;

/**
 * 飞机险信息
 */
@Data
public class AircraftMG implements Serializable {
    private static final long serialVersionUID = -8269340692411877783L;
    /**
     * 飞机
     */
    private String subjectId;
}
