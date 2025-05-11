package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import lombok.Data;

import java.io.Serializable;

/**
 * 船舶险信息
 */
@Data
public class HullMG implements Serializable {
    private static final long serialVersionUID = -8269340692411877783L;

    /**
     * 船舶分组ID
     */
    private String hullGroupID;

    /**
     * 船名
     */
    private String hullName;

    /**
     * 船舶识别号
     */
    private String hullIdentificationNo;

    /**
     * IMO编号
     */
    private String hullIMONo;

}
